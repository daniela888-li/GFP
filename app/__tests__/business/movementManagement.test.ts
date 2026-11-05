import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MovementManagementService } from '../../src/business/movements/movementManagement';
import type { MovementInput } from '../../src/business/movements/movementRules';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { SessionManager } from '../../src/services/session/sessionManager';
import { nodeRandomBytes } from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const NOW = new Date(2026, 10, 4, 12).getTime();
const INPUT: MovementInput = {
  type: 'expense',
  amount: '45,50',
  date: '04/11/2026',
  categoryId: 'food',
  description: '  Mercado ',
};

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  const sessions = new SessionManager(nodeRandomBytes);
  const dependencies = {
    database,
    sessions,
    random: nodeRandomBytes,
    now: () => NOW,
  };
  const movements = new MovementManagementService(dependencies);
  const categories = new CategoryManagementService(dependencies);
  const session = sessions.start(userId);
  return { database, userId, sessions, movements, categories, session };
}

type Context = Awaited<ReturnType<typeof setup>>;

async function saved(context: Context, input: MovementInput = INPUT) {
  const result = await context.movements.create(context.session, input);
  if (result.status !== 'saved') {
    throw new Error(`movement not saved: ${result.status}`);
  }
  return result.movement;
}

async function customCategory(context: Context, type: string) {
  const result = await context.categories.create(context.session, {
    name: 'Propia',
    type,
    icon: 'pet',
  });
  if (result.status !== 'saved') {
    throw new Error(result.status);
  }
  return result.category;
}

async function categoryIds(context: Context, type: 'income' | 'expense') {
  const result = await context.movements.listCategories(context.session, type);
  if (result.status !== 'ok') {
    throw new Error(result.status);
  }
  return result.categories.map(category => category.id);
}

describe('HU4-CA02 categories of the form', () => {
  test('expense lists expense categories, with Otros last', async () => {
    const ids = await categoryIds(await setup(), 'expense');
    expect(ids).toHaveLength(8);
    expect(ids).not.toContain('salary');
    expect(ids[ids.length - 1]).toBe('other');
  });

  test('income lists income categories and Otros (E07-D1)', async () => {
    expect(await categoryIds(await setup(), 'income')).toEqual([
      'salary',
      'other',
    ]);
  });

  test('HU8-CA08: a new category appears at once', async () => {
    const context = await setup();
    const category = await customCategory(context, 'income');
    expect(await categoryIds(context, 'income')).toEqual([
      'salary',
      category.id,
      'other',
    ]);
  });
});

describe('HU4-CA07 save', () => {
  test('stores the movement linked to the authenticated user', async () => {
    const context = await setup();
    const movement = await saved(context);
    const row = await context.database.execute(
      'SELECT * FROM movements WHERE id = ?',
      [movement.id],
    );
    expect(row.rows[0]).toMatchObject({
      user_id: context.userId,
      category_id: 'food',
      type: 'expense',
      amount_cents: 4550,
      movement_date: '2026-11-04',
      description: 'Mercado',
    });
  });

  test('returns field errors and stores nothing when the data is invalid', async () => {
    const context = await setup();
    const result = await context.movements.create(context.session, {
      ...INPUT,
      amount: '0',
      date: '05/11/2026',
      categoryId: '',
    });
    expect(result).toEqual({
      status: 'invalid_input',
      errors: { amount: 'invalid', date: 'future', categoryId: 'required' },
    });
    const total = await context.database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(readInteger(total.rows[0], 'total')).toBe(0);
  });

  test('rejects a category of the other type', async () => {
    const context = await setup();
    await expect(
      context.movements.create(context.session, {
        ...INPUT,
        type: 'income',
      }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'unavailable' },
    });
  });

  test('accepts an income movement in Otros (E06-D3)', async () => {
    const context = await setup();
    const movement = await saved(context, {
      ...INPUT,
      type: 'income',
      categoryId: 'other',
    });
    expect(movement.type).toBe('income');
  });

  test('rejects the category of another user', async () => {
    const context = await setup();
    const foreign = await customCategory(context, 'expense');
    const otherId = await createAccount(
      context.database,
      profile({
        documentNumber: '99887766',
        email: 'otro@example.com',
        phoneNumber: '3009998877',
      }),
    );
    const otherSession = context.sessions.start(otherId);
    await expect(
      context.movements.create(otherSession, {
        ...INPUT,
        categoryId: foreign.id,
      }),
    ).resolves.toEqual({
      status: 'invalid_input',
      errors: { categoryId: 'unavailable' },
    });
  });

  test('HU2-CA10: an expired session reads and writes nothing', async () => {
    const context = await setup();
    context.sessions.end();
    await expect(
      context.movements.create(context.session, INPUT),
    ).resolves.toEqual({ status: 'session_expired' });
    await expect(
      context.movements.listCategories(context.session, 'expense'),
    ).resolves.toEqual({ status: 'session_expired' });
  });
});

describe('HU4 edit', () => {
  test('HU4-CA10: loads and updates the movement', async () => {
    const context = await setup();
    const movement = await saved(context);
    const found = await context.movements.find(context.session, movement.id);
    expect(found.status).toBe('ok');
    const result = await context.movements.update(
      context.session,
      movement.id,
      { ...INPUT, amount: '100', categoryId: 'transport', description: '' },
    );
    expect(result).toMatchObject({
      status: 'saved',
      movement: {
        amountCents: 10000,
        categoryId: 'transport',
        description: null,
      },
    });
  });

  test('a movement of another user does not exist', async () => {
    const context = await setup();
    const movement = await saved(context);
    const otherId = await createAccount(
      context.database,
      profile({
        documentNumber: '99887766',
        email: 'otro@example.com',
        phoneNumber: '3009998877',
      }),
    );
    const otherSession = context.sessions.start(otherId);
    await expect(
      context.movements.find(otherSession, movement.id),
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      context.movements.update(otherSession, movement.id, INPUT),
    ).resolves.toEqual({ status: 'not_found' });
  });

  test('keeps a category whose type changed after saving', async () => {
    const context = await setup();
    const category = await customCategory(context, 'expense');
    const movement = await saved(context, {
      ...INPUT,
      categoryId: category.id,
    });
    await context.categories.update(context.session, category.id, {
      name: 'Propia',
      type: 'income',
      icon: 'pet',
    });
    const result = await context.movements.update(
      context.session,
      movement.id,
      { ...INPUT, amount: '10', categoryId: category.id },
    );
    expect(result.status).toBe('saved');
  });
});

describe('HU8-CA07c reassignment to Otros', () => {
  test('deleting a category moves its movements and keeps their type', async () => {
    const context = await setup();
    const category = await customCategory(context, 'income');
    const movement = await saved(context, {
      ...INPUT,
      type: 'income',
      categoryId: category.id,
    });
    await expect(
      context.categories.countMovements(context.session, category.id),
    ).resolves.toEqual({ status: 'ok', total: 1 });
    await expect(
      context.categories.remove(context.session, category.id),
    ).resolves.toEqual({ status: 'deleted' });
    const found = await context.movements.find(context.session, movement.id);
    expect(found).toMatchObject({
      status: 'ok',
      movement: { categoryId: 'other', type: 'income', amountCents: 4550 },
    });
  });

  test('a reassigned income movement stays editable (E06-D3)', async () => {
    const context = await setup();
    const category = await customCategory(context, 'income');
    const movement = await saved(context, {
      ...INPUT,
      type: 'income',
      categoryId: category.id,
    });
    await context.categories.remove(context.session, category.id);
    const result = await context.movements.update(
      context.session,
      movement.id,
      { ...INPUT, type: 'income', amount: '1', categoryId: 'other' },
    );
    expect(result.status).toBe('saved');
  });
});
