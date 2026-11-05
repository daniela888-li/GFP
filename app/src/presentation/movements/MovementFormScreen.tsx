import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MovementGateway } from '../../business/movements/movementManagement';
import {
  amountInputFrom,
  displayDateFrom,
  isoDateFrom,
  MOVEMENT_DESCRIPTION_MAX_LENGTH,
  type MovementField,
  type MovementFieldError,
  type MovementFieldErrors,
} from '../../business/movements/movementRules';
import {
  CATEGORY_TYPES,
  type CategoryType,
} from '../../infrastructure/database/categoryCatalogs';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { FormScrollView } from '../components/FormScrollView';
import { MessageDialog } from '../components/MessageDialog';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { COLORS } from '../components/theme';
import { DateField } from './DateField';
import { MOVEMENT_TEXTS as TEXTS } from './movementTexts';

export type MovementSummary = {
  type: CategoryType;
  categoryName: string;
  amountCents: number;
};

type MovementFormScreenProps = {
  gateway: MovementGateway;
  session: UserSession;
  // Con `movementId` el formulario abre en modo edición (HU4-CA10); su punto de entrada es el
  // botón «Editar» del historial (HU5, Etapa 08).
  movementId?: string;
  // Datos leídos de un comprobante (HU7). Tipo fijo en Gasto; lo no identificado va vacío.
  prefill?: MovementPrefill;
  onCreated: (summary: MovementSummary) => void;
  onCancel: () => void;
  onSessionExpired: () => void;
  now?: () => number;
};

export type MovementPrefill = {
  amount: string;
  date: string;
  description: string;
};

const DEFAULT_TYPE: CategoryType = 'expense';

function fieldMessage(
  field: MovementField,
  error: MovementFieldError | undefined,
): string | null {
  if (error === undefined) {
    return null;
  }
  switch (field) {
    case 'amount':
      return TEXTS.errors.amount;
    case 'date':
      if (error === 'future') {
        return TEXTS.errors.futureDate;
      }
      return error === 'required'
        ? TEXTS.errors.requiredDate
        : TEXTS.errors.invalidDate;
    case 'categoryId':
      return error === 'unavailable'
        ? TEXTS.errors.unavailableCategory
        : TEXTS.errors.requiredCategory;
    case 'description':
      return TEXTS.errors.description;
    default:
      return TEXTS.errors.form;
  }
}

// Formulario de HU4. La validación vive en el servicio: la pantalla muestra sus errores junto
// a cada campo y el aviso general «Error en los campos ingresados» (HU4-CA13).
export function MovementFormScreen({
  gateway,
  session,
  movementId,
  prefill,
  onCreated,
  onCancel,
  onSessionExpired,
  now = Date.now,
}: MovementFormScreenProps) {
  const editing = movementId !== undefined;
  const texts = editing ? TEXTS.edit : TEXTS.create;
  const [today] = useState(() => isoDateFrom(now()));
  const [type, setType] = useState<CategoryType>(DEFAULT_TYPE);
  const [amount, setAmount] = useState(prefill?.amount ?? '');
  const [date, setDate] = useState(
    () => prefill?.date ?? displayDateFrom(today),
  );
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<MovementFieldErrors>({});
  const [showFormError, setShowFormError] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadCategories = useCallback(
    async (nextType: CategoryType, includeId?: string) => {
      const result = await gateway.listCategories(session, nextType, includeId);
      if (!mounted.current) {
        return [];
      }
      if (result.status === 'ok') {
        setCategories(result.categories);
        return result.categories;
      }
      if (result.status === 'session_expired') {
        onSessionExpired();
      } else {
        setDialog(TEXTS.errors.loadFailed);
      }
      return [];
    },
    [gateway, session, onSessionExpired],
  );

  useEffect(() => {
    async function load() {
      if (movementId === undefined) {
        await loadCategories(DEFAULT_TYPE);
        return;
      }
      const result = await gateway.find(session, movementId);
      if (!mounted.current) {
        return;
      }
      if (result.status === 'ok') {
        const { movement } = result;
        setType(movement.type);
        setAmount(amountInputFrom(movement.amountCents));
        setDate(displayDateFrom(movement.date));
        setCategoryId(movement.categoryId);
        setDescription(movement.description ?? '');
        await loadCategories(movement.type, movement.categoryId);
      } else if (result.status === 'session_expired') {
        onSessionExpired();
      } else {
        setDialog(
          result.status === 'not_found'
            ? TEXTS.errors.notFound
            : TEXTS.errors.loadFailed,
        );
      }
      if (mounted.current) {
        setLoading(false);
      }
    }
    load();
  }, [gateway, session, movementId, loadCategories, onSessionExpired]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onCancel();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onCancel]);

  function clearFeedback() {
    setErrors({});
    setShowFormError(false);
    setUpdated(false);
  }

  async function selectType(nextType: CategoryType) {
    if (nextType === type) {
      return;
    }
    setType(nextType);
    clearFeedback();
    const available = await loadCategories(nextType);
    if (!available.some(category => category.id === categoryId)) {
      setCategoryId('');
    }
  }

  // HU4-CA11: los campos vuelven al estado inicial del formulario (HU4-CA03: fecha de hoy).
  function clear() {
    setAmount('');
    setDate(displayDateFrom(isoDateFrom(now())));
    setCategoryId('');
    setDescription('');
    clearFeedback();
    if (type !== DEFAULT_TYPE) {
      setType(DEFAULT_TYPE);
      loadCategories(DEFAULT_TYPE);
    }
  }

  async function save() {
    if (saving) {
      return;
    }
    setSaving(true);
    setUpdated(false);
    const input = { type, amount, date, categoryId, description };
    const result =
      movementId === undefined
        ? await gateway.create(session, input)
        : await gateway.update(session, movementId, input);
    if (!mounted.current) {
      return;
    }
    setSaving(false);
    switch (result.status) {
      case 'saved':
        setErrors({});
        setShowFormError(false);
        if (movementId === undefined) {
          onCreated({
            type: result.movement.type,
            categoryName: result.category.name,
            amountCents: result.movement.amountCents,
          });
        } else {
          setUpdated(true);
        }
        break;
      case 'invalid_input':
        setErrors(result.errors);
        setShowFormError(true);
        break;
      case 'session_expired':
        onSessionExpired();
        break;
      case 'not_found':
        setDialog(TEXTS.errors.notFound);
        break;
      default:
        setDialog(TEXTS.errors.saveFailed);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} testID="movement-loading" />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="movement-form">
      <FormScrollView contentStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {texts.title}
        </Text>
        <Text style={styles.subtitle}>{texts.subtitle}</Text>

        {prefill !== undefined &&
          (prefill.amount === '' ||
            prefill.date === '' ||
            prefill.description === '') && (
            <View style={styles.formError}>
              <Text style={styles.formErrorText} testID="movement-prefill-note">
                {TEXTS.prefill.partial}
              </Text>
            </View>
          )}
        <Text style={styles.label}>{TEXTS.labels.type}</Text>
        <View style={styles.types}>
          {CATEGORY_TYPES.slice()
            .reverse()
            .map(option => {
              const selected = option === type;
              const income = option === 'income';
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => {
                    selectType(option);
                  }}
                  style={[styles.type, selected && styles.typeSelected]}
                  testID={`movement-type-${option}`}
                >
                  <Text
                    style={[
                      styles.typeText,
                      income ? styles.income : styles.expense,
                    ]}
                  >
                    {`${TEXTS.typeGlyphs[option]} ${TEXTS.types[option]}`}
                  </Text>
                </Pressable>
              );
            })}
        </View>

        <TextField
          error={fieldMessage('amount', errors.amount)}
          keyboardType="decimal-pad"
          label={TEXTS.labels.amount}
          maxLength={15}
          onChangeText={setAmount}
          placeholder={TEXTS.placeholders.amount}
          testID="movement-amount"
          value={amount}
        />
        <DateField
          error={fieldMessage('date', errors.date)}
          onChange={setDate}
          today={today}
          value={date}
        />
        <SelectField
          error={fieldMessage('categoryId', errors.categoryId)}
          label={TEXTS.labels.category}
          onChange={setCategoryId}
          options={categories.map(category => ({
            value: category.id,
            label: category.name,
          }))}
          placeholder={TEXTS.placeholders.category}
          testID="movement-category"
          value={categoryId}
        />
        <TextField
          error={fieldMessage('description', errors.description)}
          label={TEXTS.labels.description}
          maxLength={MOVEMENT_DESCRIPTION_MAX_LENGTH}
          multiline
          onChangeText={setDescription}
          placeholder={TEXTS.placeholders.description}
          testID="movement-description"
          value={description}
        />

        {showFormError && (
          <View accessibilityRole="alert" style={styles.formError}>
            <Text style={styles.formErrorText} testID="movement-form-error">
              {TEXTS.errors.form}
            </Text>
          </View>
        )}
        <View style={styles.primary}>
          <ActionButton
            disabled={saving}
            label={texts.save}
            onPress={() => {
              save();
            }}
            testID="movement-save"
            variant="primary"
          />
        </View>
        <View style={styles.secondary}>
          {!editing && (
            <ActionButton
              disabled={saving}
              label={TEXTS.buttons.clear}
              onPress={clear}
              testID="movement-clear"
            />
          )}
          <ActionButton
            disabled={saving}
            label={TEXTS.buttons.cancel}
            onPress={onCancel}
            testID="movement-cancel"
          />
        </View>
        {updated && (
          <View accessibilityRole="alert" style={styles.updated}>
            <Text style={styles.updatedText} testID="movement-updated">
              {TEXTS.success.updated}
            </Text>
          </View>
        )}
      </FormScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.buttons.accept,
              onPress: () => {
                const notFound = dialog === TEXTS.errors.notFound;
                setDialog(null);
                if (notFound) {
                  onCancel();
                }
              },
              testID: 'movement-dialog-accept',
            },
          ]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
          testID="movement-dialog"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: 18,
    marginTop: 4,
  },
  label: { color: COLORS.text, fontSize: 15, marginBottom: 6 },
  types: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 4,
  },
  type: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  typeSelected: { backgroundColor: COLORS.background },
  typeText: { fontSize: 16, fontWeight: '600' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  formError: {
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  formErrorText: { color: COLORS.error, fontSize: 15, fontWeight: '600' },
  primary: { flexDirection: 'row', marginBottom: 8 },
  secondary: { flexDirection: 'row' },
  updated: {
    backgroundColor: '#E6F4EA',
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
  },
  updatedText: { color: COLORS.success, fontSize: 15, fontWeight: '600' },
});
