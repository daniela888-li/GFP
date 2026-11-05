import { fireEvent, render, screen } from '@testing-library/react-native';
import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import { MovementHistoryScreen } from '../../src/presentation/movements/MovementHistoryScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOW = new Date(2026, 10, 4, 12).getTime();

async function setup(withMovements = true) {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const dependencies = {
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => NOW,
  };
  const service = new MovementManagementService(dependencies);
  const categories = new CategoryManagementService(dependencies);
  const session = sessions.start(userId);
  const ids: Record<string, string> = {};
  if (withMovements) {
    for (const [key, type, amount, date, categoryId] of [
      ['old', 'expense', '10', '01/10/2026', 'food'],
      ['today', 'expense', '20', '04/11/2026', 'transport'],
      ['salary', 'income', '1000', '03/11/2026', 'salary'],
    ]) {
      const created = await service.create(session, {
        type,
        amount,
        date,
        categoryId,
        description: `Detalle ${key}`,
      });
      if (created.status !== 'saved') {
        throw new Error(created.status);
      }
      ids[key] = created.movement.id;
    }
  }
  const onEdit = jest.fn();
  const onNavigate = jest.fn();
  await render(
    <MovementHistoryScreen
      categories={categories}
      gateway={service}
      now={() => NOW}
      onEdit={onEdit}
      onNavigate={onNavigate}
      onSessionExpired={jest.fn()}
      session={session}
    />,
  );
  await (withMovements
    ? screen.findByTestId(`movement-card-${ids.today}`)
    : screen.findByTestId('history-empty'));
  return { ids, onEdit, onNavigate, database };
}

function shownCards() {
  return screen
    .getAllByTestId(/^movement-card-/)
    .map(card => card.props.testID);
}

describe('HU5 history', () => {
  test('shows the initial empty state', async () => {
    await setup(false);
    expect(screen.getByText('No hay movimientos registrados')).toBeTruthy();
    expect(screen.queryByText('No se encontraron movimientos')).toBeNull();
  });

  test('HU5-CA01: orders from the most recent to the oldest', async () => {
    const { ids } = await setup();
    expect(shownCards()).toEqual([
      `movement-card-${ids.today}`,
      `movement-card-${ids.salary}`,
      `movement-card-${ids.old}`,
    ]);
    expect(
      screen.getByTestId(`movement-amount-${ids.salary}`),
    ).toHaveTextContent('+$1.000');
    expect(screen.getByText('Hoy • Gasto')).toBeTruthy();
    expect(screen.getByText('Ayer • Ingreso')).toBeTruthy();
  });

  test('HU5-CA02: the category filter offers the master categories', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('history-category'));
    expect(
      await screen.findByTestId('history-category-option-salary'),
    ).toBeTruthy();
    expect(screen.getByTestId('history-category-option-food')).toBeTruthy();
  });

  test('HU5-CA03: applies every filter at once and Limpiar restores the list', async () => {
    const { ids } = await setup();
    await fireEvent.changeText(
      screen.getByTestId('history-from'),
      '01/11/2026',
    );
    await fireEvent.press(screen.getByTestId('history-type'));
    await fireEvent.press(
      await screen.findByTestId('history-type-option-expense'),
    );
    await fireEvent.press(screen.getByTestId('history-filter'));
    await screen.findByText('Detalle today');
    expect(shownCards()).toEqual([`movement-card-${ids.today}`]);
    await fireEvent.press(screen.getByTestId('history-clear'));
    await screen.findByText('Detalle old');
    expect(shownCards()).toHaveLength(3);
    expect(screen.getByTestId('history-from').props.value).toBe('');
  });

  test('HU5-CA04: shows the empty state of the filters', async () => {
    await setup();
    await fireEvent.changeText(screen.getByTestId('history-to'), '01/01/2020');
    await fireEvent.press(screen.getByTestId('history-filter'));
    expect(
      await screen.findByText('No se encontraron movimientos'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Intenta cambiar los filtros seleccionados o realiza otra búsqueda',
      ),
    ).toBeTruthy();
  });

  test('E08-D3: rejects an inverted range and keeps the list', async () => {
    await setup();
    await fireEvent.changeText(
      screen.getByTestId('history-from'),
      '02/02/2026',
    );
    await fireEvent.changeText(screen.getByTestId('history-to'), '01/02/2026');
    await fireEvent.press(screen.getByTestId('history-filter'));
    expect(
      await screen.findByText(
        'La fecha inicio no puede ser posterior a la fecha fin',
      ),
    ).toBeTruthy();
    expect(shownCards()).toHaveLength(3);
  });

  test('HU5-CA05 and CA06: asks, deletes and refreshes the list', async () => {
    const { ids, database } = await setup();
    await fireEvent.press(screen.getByTestId(`movement-delete-${ids.old}`));
    expect(
      await screen.findByText(/¿Está seguro de eliminar este movimiento\?/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Esta acción es irreversible y afectará su balance\./),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('movement-delete-cancel'));
    expect(shownCards()).toHaveLength(3);
    await fireEvent.press(screen.getByTestId(`movement-delete-${ids.old}`));
    await fireEvent.press(await screen.findByTestId('movement-delete-confirm'));
    expect(
      await screen.findByText('Movimiento eliminado correctamente'),
    ).toBeTruthy();
    expect(shownCards()).toHaveLength(2);
    const rows = await database.execute(
      'SELECT id FROM movements WHERE id = ?',
      [ids.old],
    );
    expect(rows.rows).toHaveLength(0);
  });

  test('HU5-CA07: Editar sends the selected movement to the form', async () => {
    const { ids, onEdit } = await setup();
    await fireEvent.press(screen.getByTestId(`movement-edit-${ids.salary}`));
    expect(onEdit).toHaveBeenCalledWith(ids.salary);
  });

  test('opens the new movement, photo and categories screens', async () => {
    const { onNavigate } = await setup();
    await fireEvent.press(screen.getByTestId('open-movement-form'));
    await fireEvent.press(screen.getByTestId('open-receipt-capture'));
    await fireEvent.press(screen.getByTestId('open-categories'));
    expect(onNavigate.mock.calls.map(call => call[0])).toEqual([
      'movementForm',
      'receiptCapture',
      'categories',
    ]);
  });
});
