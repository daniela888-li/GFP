import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CategoryGateway } from '../../business/categories/categoryManagement';
import type { MovementGateway } from '../../business/movements/movementManagement';
import {
  formatAmount,
  isoDateFrom,
  relativeDateLabel,
  type MovementFilterError,
  type MovementFilterInput,
} from '../../business/movements/movementRules';
import type { Category } from '../../infrastructure/database/repositories/categoryRepository';
import type { MovementListItem } from '../../infrastructure/database/repositories/movementRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoryIcon } from '../categories/CategoryIcon';
import { ActionButton } from '../components/ActionButton';
import { FieldError } from '../components/FieldError';
import { MessageDialog } from '../components/MessageDialog';
import { SelectField } from '../components/SelectField';
import { COLORS } from '../components/theme';
import { ROUTES, type RouteName } from '../navigation/routes';
import { DateField } from './DateField';
import { MOVEMENT_TEXTS } from './movementTexts';

const TEXTS = MOVEMENT_TEXTS.history;
const EMPTY_FILTERS: MovementFilterInput = {
  from: '',
  to: '',
  type: '',
  categoryId: '',
};
const ALL = 'all';

type MovementHistoryScreenProps = {
  gateway: MovementGateway;
  categories: CategoryGateway;
  session: UserSession;
  onEdit: (id: string) => void;
  onNavigate: (route: RouteName) => void;
  onSessionExpired: () => void;
  now?: () => number;
};

function filterMessage(error: MovementFilterError | null): string | null {
  switch (error) {
    case 'invalid_from':
      return TEXTS.invalidFrom;
    case 'invalid_to':
      return TEXTS.invalidTo;
    case 'inverted_range':
      return TEXTS.invertedRange;
    default:
      return null;
  }
}

// Pantalla «Historial» de HU5: lista filtrable con editar y eliminar. El resumen de totales
// del prototipo pertenece a HU6 (Etapa 09).
export function MovementHistoryScreen({
  gateway,
  categories,
  session,
  onEdit,
  onNavigate,
  onSessionExpired,
  now = Date.now,
}: MovementHistoryScreenProps) {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [movements, setMovements] = useState<MovementListItem[] | null>(null);
  const [options, setOptions] = useState<Category[]>([]);
  const [filterError, setFilterError] = useState<MovementFilterError | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<MovementListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);
  const today = isoDateFrom(now());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (filters: MovementFilterInput): Promise<boolean> => {
      const result = await gateway.list(session, filters);
      if (!mounted.current) {
        return false;
      }
      switch (result.status) {
        case 'ok':
          setMovements(result.movements);
          setFilterError(null);
          return true;
        case 'invalid_filters':
          setFilterError(result.error);
          return false;
        case 'session_expired':
          onSessionExpired();
          return false;
        default:
          setMovements(current => current ?? []);
          setDialog(TEXTS.loadFailed);
          return false;
      }
    },
    [gateway, session, onSessionExpired],
  );

  useEffect(() => {
    load(EMPTY_FILTERS);
    categories.listActiveCategories(session).then(result => {
      if (mounted.current && result.status === 'ok') {
        setOptions(result.categories);
      }
    });
  }, [load, categories, session]);

  function updateDraft(change: Partial<MovementFilterInput>) {
    setDraft(current => ({ ...current, ...change }));
    setDeleted(false);
  }

  async function filter() {
    setDeleted(false);
    if (await load(draft)) {
      setApplied(draft);
    }
  }

  async function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setDeleted(false);
    await load(EMPTY_FILTERS);
  }

  async function confirmDelete() {
    if (toDelete === null || deleting) {
      return;
    }
    setDeleting(true);
    const result = await gateway.remove(session, toDelete.id);
    if (!mounted.current) {
      return;
    }
    setDeleting(false);
    setToDelete(null);
    if (result.status === 'session_expired') {
      onSessionExpired();
      return;
    }
    if (result.status === 'failed') {
      setDialog(TEXTS.deleteFailed);
      return;
    }
    if (result.status === 'not_found') {
      setDialog(TEXTS.notFound);
    } else {
      setDeleted(true);
    }
    await load(applied);
  }

  const hasFilters = Object.values(applied).some(value => value.length > 0);

  return (
    <View style={styles.screen} testID="movement-history">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.title}
        </Text>
        <Text style={styles.subtitle}>{TEXTS.subtitle}</Text>

        <Text accessibilityRole="header" style={styles.section}>
          {TEXTS.filtersTitle}
        </Text>
        <DateField
          error={null}
          label={TEXTS.from}
          onChange={from => updateDraft({ from })}
          testID="history-from"
          today={today}
          value={draft.from}
        />
        <DateField
          error={null}
          label={TEXTS.to}
          onChange={to => updateDraft({ to })}
          testID="history-to"
          today={today}
          value={draft.to}
        />
        <FieldError
          message={filterMessage(filterError)}
          testID="history-filter-error"
        />
        <SelectField
          error={null}
          label={TEXTS.type}
          onChange={type => updateDraft({ type: type === ALL ? '' : type })}
          options={[
            { value: ALL, label: TEXTS.allTypes },
            { value: 'income', label: MOVEMENT_TEXTS.types.income },
            { value: 'expense', label: MOVEMENT_TEXTS.types.expense },
          ]}
          placeholder={TEXTS.allTypes}
          testID="history-type"
          value={draft.type}
        />
        <SelectField
          error={null}
          label={TEXTS.category}
          onChange={categoryId =>
            updateDraft({ categoryId: categoryId === ALL ? '' : categoryId })
          }
          options={[
            { value: ALL, label: TEXTS.allCategories },
            ...options.map(category => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          placeholder={TEXTS.allCategories}
          testID="history-category"
          value={draft.categoryId}
        />
        <View style={styles.buttons}>
          <ActionButton
            label={TEXTS.clearFilters}
            onPress={() => {
              clearFilters();
            }}
            testID="history-clear"
          />
          <ActionButton
            label={TEXTS.filter}
            onPress={() => {
              filter();
            }}
            testID="history-filter"
            variant="primary"
          />
        </View>

        {deleted && (
          <View accessibilityRole="alert" style={styles.success}>
            <Text style={styles.successText} testID="history-deleted">
              {TEXTS.deleted}
            </Text>
          </View>
        )}

        <Text accessibilityRole="header" style={styles.section}>
          {TEXTS.listTitle}
        </Text>
        {movements === null && (
          <ActivityIndicator color={COLORS.primary} testID="history-loading" />
        )}
        {movements !== null && movements.length === 0 && (
          <View style={styles.empty} testID="history-empty">
            <Text style={styles.emptyTitle}>
              {hasFilters ? TEXTS.emptyFilteredTitle : TEXTS.emptyInitial}
            </Text>
            {hasFilters && (
              <Text style={styles.emptySubtitle}>
                {TEXTS.emptyFilteredSubtitle}
              </Text>
            )}
          </View>
        )}
        {(movements ?? []).map(movement => {
          const income = movement.type === 'income';
          return (
            <View
              key={movement.id}
              style={styles.card}
              testID={`movement-card-${movement.id}`}
            >
              <View style={styles.cardTop}>
                <CategoryIcon icon={movement.categoryIcon} size={32} />
                <Text numberOfLines={1} style={styles.category}>
                  {movement.categoryName}
                </Text>
                <Text
                  style={[
                    styles.amount,
                    income ? styles.income : styles.expense,
                  ]}
                  testID={`movement-amount-${movement.id}`}
                >
                  {`${income ? '+' : '-'}${formatAmount(movement.amountCents)}`}
                </Text>
              </View>
              {movement.description !== null && (
                <Text style={styles.description}>{movement.description}</Text>
              )}
              <Text style={styles.meta}>
                {`${relativeDateLabel(movement.date, today)} • ${
                  MOVEMENT_TEXTS.types[movement.type]
                }`}
              </Text>
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onEdit(movement.id)}
                  style={styles.cardAction}
                  testID={`movement-edit-${movement.id}`}
                >
                  <Text style={styles.editText}>{`✏️ ${TEXTS.edit}`}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDeleted(false);
                    setToDelete(movement);
                  }}
                  style={styles.cardAction}
                  testID={`movement-delete-${movement.id}`}
                >
                  <Text style={styles.deleteText}>{`🗑️ ${TEXTS.delete}`}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View style={styles.action}>
          <ActionButton
            label={TEXTS.newMovement}
            onPress={() => onNavigate(ROUTES.movementForm)}
            testID="open-movement-form"
            variant="primary"
          />
        </View>
        <View style={styles.action}>
          <ActionButton
            label={TEXTS.photoMovement}
            onPress={() => onNavigate(ROUTES.receiptCapture)}
            testID="open-receipt-capture"
          />
        </View>
        <View style={styles.action}>
          <ActionButton
            label={TEXTS.categories}
            onPress={() => onNavigate(ROUTES.categories)}
            testID="open-categories"
          />
        </View>
      </ScrollView>
      {toDelete !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.cancel,
              onPress: () => setToDelete(null),
              testID: 'movement-delete-cancel',
              variant: 'secondary',
            },
            {
              label: TEXTS.confirm,
              onPress: () => {
                confirmDelete();
              },
              testID: 'movement-delete-confirm',
            },
          ]}
          message={`${TEXTS.deleteQuestion}\n\n${TEXTS.deleteWarning}`}
          onRequestClose={() => setToDelete(null)}
          testID="movement-delete-dialog"
        />
      )}
      {dialog !== null && (
        <MessageDialog
          actions={[
            {
              label: TEXTS.accept,
              onPress: () => setDialog(null),
              testID: 'history-dialog-accept',
            },
          ]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
          testID="history-dialog"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: 14,
    marginTop: 4,
  },
  section: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  buttons: { flexDirection: 'row', marginBottom: 14 },
  success: {
    backgroundColor: '#E6F4EA',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  successText: { color: COLORS.success, fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  category: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  amount: { fontSize: 17, fontWeight: '700' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  description: { color: COLORS.text, fontSize: 15, marginTop: 8 },
  meta: { color: COLORS.mutedText, fontSize: 13, marginTop: 4 },
  cardActions: {
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 4,
  },
  cardAction: {
    justifyContent: 'center',
    marginLeft: 16,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  editText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  deleteText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  action: { flexDirection: 'row', marginTop: 8 },
});
