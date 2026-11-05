import { fireEvent, render, screen } from '@testing-library/react-native';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import { MovementFormScreen } from '../../src/presentation/movements/MovementFormScreen';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOW = new Date(2026, 10, 4, 12).getTime();

async function setup(createFirst = false) {
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
  let movementId: string | undefined;
  if (createFirst) {
    const created = await service.create(session, {
      type: 'expense',
      amount: '45,50',
      date: '01/11/2026',
      categoryId: 'entertainment',
      description: 'Suscripción',
    });
    if (created.status !== 'saved') {
      throw new Error(created.status);
    }
    movementId = created.movement.id;
  }
  const onCreated = jest.fn();
  const onCancel = jest.fn();
  await render(
    <MovementFormScreen
      gateway={service}
      movementId={movementId}
      now={() => NOW}
      onCancel={onCancel}
      onCreated={onCreated}
      onSessionExpired={jest.fn()}
      session={session}
    />,
  );
  await screen.findByTestId('movement-form');
  return { onCreated, onCancel, database };
}

async function chooseCategory(id: string) {
  await fireEvent.press(screen.getByTestId('movement-category'));
  await fireEvent.press(
    await screen.findByTestId(`movement-category-option-${id}`),
  );
}

describe('HU4 form', () => {
  test('HU4-CA03: opens with the literal title and today as date', async () => {
    await setup();
    expect(screen.getByText('Registro de movimiento')).toBeTruthy();
    expect(screen.getByText('Añade una nueva transacción.')).toBeTruthy();
    expect(screen.getByTestId('movement-date').props.value).toBe('04/11/2026');
  });

  test('HU4-CA13: shows the general and field errors', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('Error en los campos ingresados'),
    ).toBeTruthy();
    expect(screen.getByText('Ingrese un monto válido')).toBeTruthy();
    expect(screen.getByText('Seleccione una categoría')).toBeTruthy();
  });

  test('HU4-CA04: rejects a future date', async () => {
    await setup();
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '05/11/2026',
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('La fecha no puede ser futura'),
    ).toBeTruthy();
  });

  test('HU4-CA07: a valid movement reaches the confirmation', async () => {
    const { onCreated } = await setup();
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '45,50');
    await chooseCategory('food');
    await fireEvent.press(screen.getByTestId('movement-save'));
    await screen.findByTestId('movement-form');
    expect(onCreated).toHaveBeenCalledWith({
      type: 'expense',
      categoryName: 'Alimentación',
      amountCents: 4550,
    });
  });

  test('changing the type refreshes categories and drops one that no longer fits', async () => {
    await setup();
    await chooseCategory('food');
    await fireEvent.press(screen.getByTestId('movement-type-income'));
    await screen.findByText('Selecciona una categoría');
    await fireEvent.press(screen.getByTestId('movement-category'));
    expect(
      await screen.findByTestId('movement-category-option-salary'),
    ).toBeTruthy();
    expect(screen.queryByTestId('movement-category-option-food')).toBeNull();
  });

  test('HU4-CA11: Limpiar restores the initial state', async () => {
    await setup();
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '10');
    await fireEvent.changeText(screen.getByTestId('movement-description'), 'x');
    await fireEvent.changeText(
      screen.getByTestId('movement-date'),
      '01/01/2026',
    );
    await chooseCategory('food');
    await fireEvent.press(screen.getByTestId('movement-clear'));
    expect(screen.getByTestId('movement-amount').props.value).toBe('');
    expect(screen.getByTestId('movement-description').props.value).toBe('');
    expect(screen.getByTestId('movement-date').props.value).toBe('04/11/2026');
    expect(screen.getByText('Selecciona una categoría')).toBeTruthy();
  });

  test('HU4-CA12: Cancelar leaves the form', async () => {
    const { onCancel } = await setup();
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('the calendar sets a past day and blocks future days', async () => {
    await setup();
    await fireEvent.press(screen.getByTestId('movement-date-open'));
    expect(
      screen.getByTestId('movement-date-calendar-day-2026-11-05').props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
    await fireEvent.press(
      screen.getByTestId('movement-date-calendar-previous'),
    );
    await fireEvent.press(
      screen.getByTestId('movement-date-calendar-day-2026-10-25'),
    );
    expect(screen.getByTestId('movement-date').props.value).toBe('25/10/2026');
  });

  test('HU4-CA10 and CA08: edit mode loads the data and confirms the update', async () => {
    const { database } = await setup(true);
    expect(screen.getByText('Editar movimiento')).toBeTruthy();
    expect(screen.getByTestId('movement-amount').props.value).toBe('45,50');
    expect(screen.getByTestId('movement-date').props.value).toBe('01/11/2026');
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Suscripción',
    );
    expect(screen.getByText('Entretenimiento')).toBeTruthy();
    expect(screen.queryByTestId('movement-clear')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('movement-amount'), '60');
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(
      await screen.findByText('El movimiento fue actualizado exitosamente'),
    ).toBeTruthy();
    const row = await database.execute('SELECT amount_cents FROM movements');
    expect(row.rows[0].amount_cents).toBe(6000);
  });
});
