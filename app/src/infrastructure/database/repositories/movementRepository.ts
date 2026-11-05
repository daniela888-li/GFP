import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import type { CategoryType } from '../categoryCatalogs';
import {
  readInteger,
  readOptionalText,
  readText,
  type SqlExecutor,
  type SqlRow,
} from '../sqlDatabase';
import { OwnedRepository } from './ownedRepository';

export type Movement = {
  id: string;
  categoryId: string;
  type: CategoryType;
  amountCents: number;
  // Día local en formato AAAA-MM-DD (E07-D5).
  date: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
};

export type MovementValues = {
  categoryId: string;
  type: CategoryType;
  amountCents: number;
  date: string;
  description: string | null;
};

const COLUMNS =
  'id, category_id, type, amount_cents, movement_date, description, created_at, updated_at';

function toMovement(row: SqlRow): Movement {
  return {
    id: readText(row, 'id'),
    categoryId: readText(row, 'category_id'),
    type: readText(row, 'type') as CategoryType,
    amountCents: readInteger(row, 'amount_cents'),
    date: readText(row, 'movement_date'),
    description: readOptionalText(row, 'description'),
    createdAt: readInteger(row, 'created_at'),
    updatedAt: readInteger(row, 'updated_at'),
  };
}

// Acceso a `movements` (HU4). Ninguna operación recibe un `userId`: el propietario sale de la
// sesión activa (HU4-CA07, E02-D4). Un movimiento de otro usuario se trata como inexistente.
export class MovementRepository extends OwnedRepository {
  constructor(executor: SqlExecutor, sessions: SessionManager) {
    super(executor, sessions);
  }

  async findOwn(session: UserSession, id: string): Promise<Movement | null> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT ${COLUMNS} FROM movements WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    return result.rows.length === 0 ? null : toMovement(result.rows[0]);
  }

  async createOwn(
    session: UserSession,
    id: string,
    values: MovementValues,
    now: number,
  ): Promise<Movement> {
    const userId = this.ownerOf(session);
    await this.executor.execute(
      `INSERT INTO movements (id, user_id, category_id, type, amount_cents, movement_date,
         description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        values.categoryId,
        values.type,
        values.amountCents,
        values.date,
        values.description,
        now,
        now,
      ],
    );
    return { id, ...values, createdAt: now, updatedAt: now };
  }

  // Devuelve false si el movimiento no existe o es de otro usuario.
  async updateOwn(
    session: UserSession,
    id: string,
    values: MovementValues,
    now: number,
  ): Promise<boolean> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `UPDATE movements SET category_id = ?, type = ?, amount_cents = ?, movement_date = ?,
         description = ?, updated_at = ?
        WHERE id = ? AND user_id = ?`,
      [
        values.categoryId,
        values.type,
        values.amountCents,
        values.date,
        values.description,
        now,
        id,
        userId,
      ],
    );
    return result.rowsAffected === 1;
  }

  async countByCategory(
    session: UserSession,
    categoryId: string,
  ): Promise<number> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT count(*) AS total FROM movements WHERE category_id = ? AND user_id = ?`,
      [categoryId, userId],
    );
    return readInteger(result.rows[0], 'total');
  }

  // HU8-CA07c con E06-D3: cambia solo la categoría; cada movimiento conserva su tipo.
  async reassignCategory(
    session: UserSession,
    fromCategoryId: string,
    toCategoryId: string,
    now: number,
  ): Promise<number> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `UPDATE movements SET category_id = ?, updated_at = ?
        WHERE category_id = ? AND user_id = ?`,
      [toCategoryId, now, fromCategoryId, userId],
    );
    return result.rowsAffected;
  }
}
