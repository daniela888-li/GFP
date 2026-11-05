import { StyleSheet, Text, View } from 'react-native';
import { formatAmount } from '../../business/movements/movementRules';
import type { MovementTotals } from '../../infrastructure/database/repositories/movementRepository';
import { COLORS } from '../components/theme';
import { MOVEMENT_TEXTS } from './movementTexts';

const TEXTS = MOVEMENT_TEXTS.balance;

// Resumen de HU6: verde, rojo y azul; el balance pasa a rojo si es negativo (HU6-CA03).
export function BalanceSummary({ totals }: { totals: MovementTotals | null }) {
  const income = totals?.incomeCents ?? 0;
  const expense = totals?.expenseCents ?? 0;
  const balance = income - expense;
  return (
    <View style={styles.card} testID="balance-summary">
      <View style={styles.block}>
        <Text style={styles.label}>{TEXTS.income}</Text>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.value, styles.income]}
          testID="balance-income"
        >
          {formatAmount(income)}
        </Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>{TEXTS.expense}</Text>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.value, styles.expense]}
          testID="balance-expense"
        >
          {formatAmount(expense)}
        </Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>{TEXTS.balance}</Text>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.value, balance < 0 ? styles.expense : styles.positive]}
          testID="balance-total"
        >
          {formatAmount(balance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 12,
  },
  block: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  label: { color: COLORS.mutedText, fontSize: 12, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '700' },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  positive: { color: COLORS.primary },
});
