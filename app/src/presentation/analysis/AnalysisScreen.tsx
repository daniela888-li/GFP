import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  categoryShares,
  evolution,
  periodRange,
  summarize,
  type AnalysisPeriod,
  type CategoryShare,
  type DateRange,
} from '../../analysis/financialAnalysis';
import type { MovementGateway } from '../../business/movements/movementManagement';
import {
  displayDateFrom,
  formatAmount,
  isoDateFrom,
  parseDisplayDate,
  validateMovementFilters,
  type MovementFilterInput,
} from '../../business/movements/movementRules';
import type { MovementListItem } from '../../infrastructure/database/repositories/movementRepository';
import type { UserSession } from '../../services/session/sessionManager';
import { ActionButton } from '../components/ActionButton';
import { FieldError } from '../components/FieldError';
import { MessageDialog } from '../components/MessageDialog';
import { COLORS } from '../components/theme';
import { DateField } from '../movements/DateField';
import { ANALYSIS_TEXTS as TEXTS } from './analysisTexts';
import { DonutChart, LineChart, segmentColor } from './charts';

type Period = AnalysisPeriod | 'custom';
type ChartMode = 'category' | 'evolution';

type AnalysisScreenProps = {
  gateway: MovementGateway;
  session: UserSession;
  onNewMovement: () => void;
  onOpenHistory: (filters: MovementFilterInput) => void;
  onSessionExpired: () => void;
  now?: () => number;
};

const PERIODS: readonly Period[] = ['month', 'quarter', 'year', 'custom'];

function Choice({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
      testID={testID}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Panel de HU9, con dona y líneas en `react-native-svg` (E11-D1). Cada apertura vuelve a leer la
// base, así que refleja los cambios de HU4, HU5 y HU7.
export function AnalysisScreen({
  gateway,
  session,
  onNewMovement,
  onOpenHistory,
  onSessionExpired,
  now = Date.now,
}: AnalysisScreenProps) {
  const today = isoDateFrom(now());
  const [period, setPeriod] = useState<Period>('month');
  const [range, setRange] = useState<DateRange>(() =>
    periodRange('month', today),
  );
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rangeError, setRangeError] = useState(false);
  const [movements, setMovements] = useState<MovementListItem[] | null>(null);
  const [mode, setMode] = useState<ChartMode>('category');
  const [selected, setSelected] = useState<CategoryShare | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (next: DateRange) => {
      const result = await gateway.list(session, {
        from: displayDateFrom(next.from),
        to: displayDateFrom(next.to),
        type: '',
        categoryId: '',
      });
      if (!mounted.current) {
        return;
      }
      if (result.status === 'ok') {
        setMovements(result.movements);
      } else if (result.status === 'session_expired') {
        onSessionExpired();
      } else {
        setMovements([]);
        setDialog(TEXTS.loadFailed);
      }
    },
    [gateway, session, onSessionExpired],
  );

  useEffect(() => {
    load(range);
  }, [load, range]);

  function choosePeriod(next: Period) {
    setPeriod(next);
    setSelected(null);
    setRangeError(false);
    if (next !== 'custom') {
      setRange(periodRange(next, today));
    }
  }

  function applyCustomRange() {
    const from = parseDisplayDate(customFrom);
    const to = parseDisplayDate(customTo);
    const invalid = validateMovementFilters({
      from: customFrom,
      to: customTo,
      type: '',
      categoryId: '',
    });
    if (from === null || to === null || invalid !== null) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setSelected(null);
    setRange({ from, to });
  }

  const summary = summarize(movements ?? []);
  const shares = categoryShares(movements ?? []);
  const points = evolution(movements ?? [], range);
  const empty = movements !== null && movements.length === 0;

  return (
    <View style={styles.screen} testID="analysis-screen">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {TEXTS.title}
        </Text>
        <Text style={styles.subtitle}>{TEXTS.subtitle}</Text>

        <Text accessibilityRole="header" style={styles.section}>
          {TEXTS.period}
        </Text>
        <View style={styles.choices}>
          {PERIODS.map(option => (
            <Choice
              key={option}
              label={TEXTS.periods[option]}
              onPress={() => choosePeriod(option)}
              selected={period === option}
              testID={`analysis-period-${option}`}
            />
          ))}
        </View>
        {period === 'custom' && (
          <View>
            <DateField
              error={null}
              label={TEXTS.from}
              onChange={setCustomFrom}
              testID="analysis-from"
              today={today}
              value={customFrom}
            />
            <DateField
              error={null}
              label={TEXTS.to}
              onChange={setCustomTo}
              testID="analysis-to"
              today={today}
              value={customTo}
            />
            <FieldError
              message={rangeError ? TEXTS.invalidRange : null}
              testID="analysis-range-error"
            />
            <View style={styles.row}>
              <ActionButton
                label={TEXTS.apply}
                onPress={applyCustomRange}
                testID="analysis-apply"
                variant="primary"
              />
            </View>
          </View>
        )}

        {movements === null && (
          <ActivityIndicator color={COLORS.primary} testID="analysis-loading" />
        )}

        {empty && (
          <View style={styles.empty} testID="analysis-empty">
            <Text style={styles.emptyTitle}>{TEXTS.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{TEXTS.emptySubtitle}</Text>
            <View style={styles.row}>
              <ActionButton
                label={TEXTS.newMovement}
                onPress={onNewMovement}
                testID="analysis-new-movement"
                variant="primary"
              />
            </View>
          </View>
        )}

        {movements !== null && !empty && (
          <>
            <Text accessibilityRole="header" style={styles.section}>
              {TEXTS.summary}
            </Text>
            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>{TEXTS.income}</Text>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[styles.kpiValue, styles.income]}
                  testID="analysis-income"
                >
                  {formatAmount(summary.incomeCents)}
                </Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>{TEXTS.expense}</Text>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[styles.kpiValue, styles.expense]}
                  testID="analysis-expense"
                >
                  {formatAmount(summary.expenseCents)}
                </Text>
              </View>
              <View style={[styles.kpi, styles.kpiBalance]}>
                <Text style={styles.kpiBalanceLabel}>{TEXTS.balance}</Text>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={styles.kpiBalanceValue}
                  testID="analysis-balance"
                >
                  {formatAmount(summary.balanceCents)}
                </Text>
              </View>
            </View>

            <View style={styles.choices}>
              <Choice
                label={TEXTS.byCategory}
                onPress={() => setMode('category')}
                selected={mode === 'category'}
                testID="analysis-mode-category"
              />
              <Choice
                label={TEXTS.byTime}
                onPress={() => setMode('evolution')}
                selected={mode === 'evolution'}
                testID="analysis-mode-evolution"
              />
            </View>

            {mode === 'category' && (
              <View testID="analysis-categories">
                <Text accessibilityRole="header" style={styles.section}>
                  {TEXTS.categoriesTitle}
                </Text>
                {shares.length === 0 && (
                  <Text style={styles.note}>{TEXTS.noExpenses}</Text>
                )}
                {shares.length > 0 && (
                  <DonutChart
                    onSelect={setSelected}
                    selectedId={selected?.categoryId ?? null}
                    shares={shares}
                    totalLabel={TEXTS.totalExpenses}
                    totalValue={formatAmount(summary.expenseCents)}
                  />
                )}
                {shares.map((share, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={share.categoryId}
                    onPress={() => setSelected(share)}
                    style={styles.share}
                    testID={`analysis-share-${share.categoryId}`}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: segmentColor(index) },
                      ]}
                    />
                    <Text style={styles.shareName}>{share.name}</Text>
                    <Text style={styles.sharePercent}>{share.percent}%</Text>
                  </Pressable>
                ))}
                {selected !== null && (
                  <View style={styles.selected} testID="analysis-selected">
                    <Text style={styles.selectedLabel}>
                      {`${TEXTS.selected}: ${selected.name} · ${selected.percent}%`}
                    </Text>
                    <Text style={styles.selectedAmount}>
                      {formatAmount(selected.totalCents)}
                    </Text>
                    <View style={styles.row}>
                      <ActionButton
                        label={TEXTS.viewMovements}
                        onPress={() =>
                          onOpenHistory({
                            from: displayDateFrom(range.from),
                            to: displayDateFrom(range.to),
                            type: 'expense',
                            categoryId: selected.categoryId,
                          })
                        }
                        testID="analysis-view-movements"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {mode === 'evolution' && (
              <View testID="analysis-evolution">
                <Text accessibilityRole="header" style={styles.section}>
                  {TEXTS.evolutionTitle}
                </Text>
                <View style={styles.legend}>
                  <Text style={styles.income}>{`■ ${TEXTS.legendIncome}`}</Text>
                  <Text style={styles.expense}>
                    {`■ ${TEXTS.legendExpense}`}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart points={points} />
                </ScrollView>
                <Text style={styles.note} testID="analysis-trend">
                  {summary.balanceCents >= 0
                    ? TEXTS.incomesAhead(formatAmount(summary.balanceCents))
                    : TEXTS.expensesAhead(formatAmount(-summary.balanceCents))}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {dialog !== null && (
        <MessageDialog
          actions={[{ label: TEXTS.accept, onPress: () => setDialog(null) }]}
          message={dialog}
          onRequestClose={() => setDialog(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.mutedText, fontSize: 15, marginTop: 4 },
  section: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choice: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 4,
    minHeight: 44,
    width: '48.5%',
  },
  choiceSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  choiceText: { color: COLORS.text, fontSize: 14 },
  choiceTextSelected: { color: COLORS.primaryText, fontWeight: '700' },
  row: { flexDirection: 'row', marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 6,
    textAlign: 'center',
  },
  kpis: { flexDirection: 'row', marginBottom: 12 },
  kpi: {
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: 6,
    padding: 10,
  },
  kpiBalance: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    marginRight: 0,
  },
  kpiLabel: { color: COLORS.mutedText, fontSize: 12 },
  kpiValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  kpiBalanceLabel: { color: COLORS.primaryText, fontSize: 12 },
  kpiBalanceValue: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  income: { color: COLORS.success },
  expense: { color: COLORS.error },
  note: { color: COLORS.mutedText, fontSize: 14, marginTop: 10 },
  share: { alignItems: 'center', flexDirection: 'row', minHeight: 44 },
  dot: { borderRadius: 6, height: 12, marginRight: 10, width: 12 },
  shareName: { color: COLORS.text, flex: 1, fontSize: 15 },
  sharePercent: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  selected: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    marginTop: 4,
    padding: 12,
  },
  selectedLabel: { color: COLORS.text, fontSize: 14 },
  selectedAmount: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-around' },
});
