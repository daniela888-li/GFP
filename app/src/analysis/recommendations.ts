import { formatAmount } from '../business/movements/movementRules';
import type { MovementListItem } from '../infrastructure/database/repositories/movementRepository';
import {
  categoryShares,
  monthRange,
  summarize,
  type DateRange,
} from './financialAnalysis';

// Motor de reglas de HU10: se ejecuta en el dispositivo, sobre los movimientos del usuario
// autenticado. Las reglas 1 a 3 son literales de la historia; la 4 sale de sus elementos
// visuales («Informativo / Consejo») y del prototipo (E12-D2).

export type RecommendationSeverity = 'critical' | 'info';

export type Recommendation = {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  source: string;
  range: DateRange;
  type: 'expense' | '';
  categoryId: string;
};

const UNUSUAL_INCREASE = 1.3;
const CRITICAL_SHARE = 0.5;

function within(
  movements: readonly MovementListItem[],
  range: DateRange,
): MovementListItem[] {
  return movements.filter(
    movement => movement.date >= range.from && movement.date <= range.to,
  );
}

export function evaluateRecommendations(
  movements: readonly MovementListItem[],
  today: string,
): Recommendation[] {
  const current = monthRange(today);
  const previous = monthRange(today, -1);
  const thisMonth = within(movements, current);
  const lastMonth = within(movements, previous);
  const summary = summarize(thisMonth);
  const shares = categoryShares(thisMonth);
  const result: Recommendation[] = [];

  // Regla 1: balance negativo.
  if (summary.expenseCents > summary.incomeCents) {
    result.push({
      id: 'negative-balance',
      severity: 'critical',
      title: 'Regla de Balance Negativo',
      description:
        '¡Cuidado! Tus gastos totales superan tus ingresos en el período actual.',
      source: `Diferencia: ${formatAmount(summary.balanceCents)} - Mes actual`,
      range: current,
      type: 'expense',
      categoryId: '',
    });
  }

  // Regla 2: una categoría supera el 50 % de los gastos del mes.
  const critical = shares.find(
    share => share.totalCents / summary.expenseCents > CRITICAL_SHARE,
  );
  if (critical !== undefined) {
    result.push({
      id: `critical-category-${critical.categoryId}`,
      severity: 'critical',
      title: 'Categoría Crítica',
      description: `${critical.name} representa el ${critical.percent}% de tus gastos de este mes.`,
      source: `Monto evaluado: ${formatAmount(
        critical.totalCents,
      )} - Mes actual`,
      range: current,
      type: 'expense',
      categoryId: critical.categoryId,
    });
  }

  // Regla 3: la categoría sube más de 30 % frente al mes anterior. Sin gastos el mes anterior
  // no hay base de comparación (E12-D1).
  const lastShares = new Map(
    categoryShares(lastMonth).map(share => [share.categoryId, share]),
  );
  for (const share of shares) {
    const base = lastShares.get(share.categoryId);
    if (
      base !== undefined &&
      share.totalCents > base.totalCents * UNUSUAL_INCREASE
    ) {
      const increase = Math.round(
        (share.totalCents / base.totalCents - 1) * 100,
      );
      result.push({
        id: `unusual-increase-${share.categoryId}`,
        severity: 'critical',
        title: '¡Alerta de Gastos Altos!',
        description: `Tus gastos en ${share.name} subieron un ${increase}% este mes en comparación con el anterior.`,
        source: `Monto evaluado: ${formatAmount(
          share.totalCents,
        )} - Mes actual`,
        range: current,
        type: 'expense',
        categoryId: share.categoryId,
      });
    }
  }

  // Consejo: balance positivo en el mes.
  if (summary.incomeCents > 0 && summary.balanceCents > 0) {
    result.push({
      id: 'positive-balance',
      severity: 'info',
      title: 'Consejo de Ahorro',
      description:
        'Mantienes un balance positivo este mes. Considera aumentar tu meta de ahorro mensual.',
      source: `Balance actual: +${formatAmount(summary.balanceCents)}`,
      range: current,
      type: '',
      categoryId: '',
    });
  }
  return result;
}
