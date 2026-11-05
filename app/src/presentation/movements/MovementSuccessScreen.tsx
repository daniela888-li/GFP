import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { formatAmount } from '../../business/movements/movementRules';
import { ActionButton } from '../components/ActionButton';
import { COLORS } from '../components/theme';
import type { MovementSummary } from './MovementFormScreen';
import { MOVEMENT_TEXTS as TEXTS } from './movementTexts';

// Confirmación de HU4-CA08 según el prototipo. El formulario ya se cerró, así que al volver
// abre limpio (HU4-CA09, E07-D4). La fila «Comercio» del prototipo se muestra como «Categoría»
// porque HU4 no tiene ese campo.
export function MovementSuccessScreen({
  summary,
  onBack,
}: {
  summary: MovementSummary;
  onBack: () => void;
}) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onBack]);

  const income = summary.type === 'income';
  const tone = income ? styles.income : styles.expense;
  return (
    <View style={styles.screen} testID="movement-success">
      <Text accessibilityRole="header" style={styles.title}>
        {TEXTS.success.title}
      </Text>
      <View style={styles.card}>
        <Text style={styles.message}>{TEXTS.success.created}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{TEXTS.success.type}</Text>
          <Text style={[styles.value, tone]}>{TEXTS.types[summary.type]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{TEXTS.success.category}</Text>
          <Text style={styles.value}>{summary.categoryName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{TEXTS.success.amount}</Text>
          <Text style={[styles.value, tone]} testID="movement-success-amount">
            {`${income ? '+' : '-'}${formatAmount(summary.amountCents)}`}
          </Text>
        </View>
      </View>
      <View style={styles.action}>
        <ActionButton
          label={TEXTS.buttons.backToHistory}
          onPress={onBack}
          testID="movement-back-to-history"
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  message: {
    color: COLORS.success,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: { color: COLORS.mutedText, fontSize: 15 },
  value: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  action: { flexDirection: 'row', marginTop: 20 },
});
