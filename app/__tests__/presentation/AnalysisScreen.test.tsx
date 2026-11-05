import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import { AnalysisScreen } from '../../src/presentation/analysis/AnalysisScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOW = new Date(2026, 10, 15, 12).getTime();

async function setup(movements: string[][]) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const service = new MovementManagementService({
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => NOW,
  });
  const session = sessions.start(userId);
  for (const [type, amount, date, categoryId] of movements) {
    await service.create(session, {
      type,
      amount,
      date,
      categoryId,
      description: '',
    });
  }
  return { service, session, onOpenHistory: jest.fn() };
}

const DATA = [
  ['income', '1000', '02/11/2026', 'salary'],
  ['expense', '750', '03/11/2026', 'housing'],
  ['expense', '250', '04/11/2026', 'food'],
  ['expense', '999', '03/10/2026', 'food'],
];

describe('HU9 screen', () => {
  async function renderAnalysis(movements = DATA) {
    const context = await setup(movements);
    await render(
      <AnalysisScreen
        gateway={context.service}
        now={() => NOW}
        onNewMovement={jest.fn()}
        onOpenHistory={context.onOpenHistory}
        onSessionExpired={jest.fn()}
        session={context.session}
      />,
    );
    return context;
  }

  test('shows the literal empty state and hides the charts', async () => {
    await renderAnalysis([]);
    expect(
      await screen.findByText(
        'No hay suficientes movimientos registrados para generar el análisis financiero de este período',
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('analysis-categories')).toBeNull();
  });

  test('calculates the KPIs of the current month', async () => {
    await renderAnalysis();
    expect(await screen.findByTestId('analysis-income')).toHaveTextContent(
      '$1.000,00',
    );
    expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
      '$1.000,00',
    );
    expect(screen.getByTestId('analysis-balance')).toHaveTextContent('$0,00');
  });

  test('changing the period updates every total', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-income');
    await fireEvent.press(screen.getByTestId('analysis-period-quarter'));
    await waitFor(() =>
      expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
        '$1.999,00',
      ),
    );
  });

  test('a category shows its amount and opens the filtered history', async () => {
    const { onOpenHistory } = await renderAnalysis();
    await fireEvent.press(await screen.findByTestId('analysis-share-housing'));
    expect(screen.getByTestId('analysis-donut')).toBeTruthy();
    expect(screen.getByTestId('analysis-selected')).toHaveTextContent(
      /\$750,00/,
    );
    await fireEvent.press(screen.getByTestId('analysis-view-movements'));
    expect(onOpenHistory).toHaveBeenCalledWith({
      from: '01/11/2026',
      to: '15/11/2026',
      type: 'expense',
      categoryId: 'housing',
    });
  });

  test('the chart button alternates to the evolution', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-categories');
    await fireEvent.press(screen.getByTestId('analysis-mode-evolution'));
    expect(await screen.findByTestId('analysis-evolution')).toBeTruthy();
    expect(screen.getByTestId('analysis-lines')).toBeTruthy();
    expect(screen.queryByTestId('analysis-categories')).toBeNull();
  });

  test('applies a custom range and rejects an invalid one', async () => {
    await renderAnalysis();
    await screen.findByTestId('analysis-income');
    await fireEvent.press(screen.getByTestId('analysis-period-custom'));
    await fireEvent.press(screen.getByTestId('analysis-apply'));
    expect(
      await screen.findByText('Ingrese un rango de fechas válido'),
    ).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId('analysis-from'),
      '01/10/2026',
    );
    await fireEvent.changeText(screen.getByTestId('analysis-to'), '31/10/2026');
    await fireEvent.press(screen.getByTestId('analysis-apply'));
    await waitFor(() =>
      expect(screen.getByTestId('analysis-expense')).toHaveTextContent(
        '$999,00',
      ),
    );
  });
});
