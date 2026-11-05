import { CategoryManagementService } from '../../src/business/categories/categoryManagement';
import { MIGRATIONS } from '../../src/infrastructure/database/migrations';
import { migrateDatabase } from '../../src/infrastructure/database/migrator';
import { readInteger } from '../../src/infrastructure/database/sqlDatabase';
import { SessionManager } from '../../src/services/session/sessionManager';
import {
  createNodeSqliteDatabase,
  nodeRandomBytes,
} from '../../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  profile,
} from '../../testing/identityFixtures';

const INSERT = `INSERT INTO movements (id, user_id, category_id, type, amount_cents,
  movement_date, description, created_at, updated_at)
  VALUES (?, ?, ?, 'expense', ?, ?, NULL, 1, 1)`;

async function setup() {
  const database = await createMigratedDatabase();
  const userId = await createAccount(database, profile());
  return { database, userId };
}

describe('movements schema (migration 5)', () => {
  test('upgrades a database that stopped at migration 4', async () => {
    const database = createNodeSqliteDatabase();
    await migrateDatabase(database, () => 1, MIGRATIONS.slice(0, 4));
    await expect(migrateDatabase(database, () => 2)).resolves.toBe(5);
    const table = await database.execute(
      "SELECT count(*) AS total FROM sqlite_master WHERE name = 'movements'",
    );
    expect(readInteger(table.rows[0], 'total')).toBe(1);
  });

  test('rejects amounts and dates outside the rules', async () => {
    const { database, userId } = await setup();
    await expect(
      database.execute(INSERT, ['m1', userId, 'food', 0, '2026-11-04']),
    ).rejects.toThrow();
    await expect(
      database.execute(INSERT, ['m2', userId, 'food', 100, '04/11/2026']),
    ).rejects.toThrow();
  });

  test('blocks the category of another user even with direct SQL', async () => {
    const { database, userId } = await setup();
    const sessions = new SessionManager(nodeRandomBytes);
    const service = new CategoryManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    });
    const created = await service.create(sessions.start(userId), {
      name: 'Propia',
      type: 'expense',
      icon: 'pet',
    });
    if (created.status !== 'saved') {
      throw new Error(created.status);
    }
    const otherId = await createAccount(
      database,
      profile({
        documentNumber: '99887766',
        email: 'otro@example.com',
        phoneNumber: '3009998877',
      }),
    );
    await expect(
      database.execute(INSERT, [
        'm3',
        otherId,
        created.category.id,
        100,
        '2026-11-04',
      ]),
    ).rejects.toThrow(/movement_category_unavailable/);
  });

  test('a category with movements is not deleted in cascade (E06-D7)', async () => {
    const { database, userId } = await setup();
    await database.execute(
      `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
         created_at, updated_at) VALUES ('c1', ?, 0, 'Propia', 'propia', 'expense', 'pet', 1, 1)`,
      [userId],
    );
    await database.execute(INSERT, ['m4', userId, 'c1', 100, '2026-11-04']);
    await expect(
      database.execute("DELETE FROM categories WHERE id = 'c1'"),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  test('deleting a user removes their categories and movements', async () => {
    const { database, userId } = await setup();
    await database.execute(
      `INSERT INTO categories (id, user_id, is_system, name, name_normalized, type, icon,
         created_at, updated_at) VALUES ('c2', ?, 0, 'Propia', 'propia', 'expense', 'pet', 1, 1)`,
      [userId],
    );
    await database.execute(INSERT, ['m5', userId, 'c2', 100, '2026-11-04']);
    await database.execute('DELETE FROM users WHERE id = ?', [userId]);
    const left = await database.execute(
      'SELECT count(*) AS total FROM movements',
    );
    expect(readInteger(left.rows[0], 'total')).toBe(0);
  });
});
