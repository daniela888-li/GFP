import {
  OTHER_CATEGORY_ID,
  type CategoryType,
} from '../../infrastructure/database/categoryCatalogs';
import {
  CategoryRepository,
  type Category,
} from '../../infrastructure/database/repositories/categoryRepository';
import {
  MovementRepository,
  type Movement,
  type MovementListItem,
  type MovementTotals,
} from '../../infrastructure/database/repositories/movementRepository';
import type {
  SqlDatabase,
  SqlExecutor,
} from '../../infrastructure/database/sqlDatabase';
import {
  randomUuid,
  secureRandomBytes,
  type RandomBytesSource,
} from '../../infrastructure/security/secureRandom';
import { serializedByDatabase } from '../../services/databaseQueue';
import {
  SessionError,
  type SessionManager,
  type UserSession,
} from '../../services/session/sessionManager';
import {
  categoryFitsType,
  isMovementType,
  isoDateFrom,
  parseDisplayDate,
  toValidMovementInput,
  validateMovementFilters,
  validateMovementInput,
  type MovementFieldErrors,
  type MovementFilterError,
  type MovementFilterInput,
  type MovementInput,
} from './movementRules';

// Gestión de Ingresos y Gastos (C4, HU4). Las operaciones exigen la sesión activa; si ya no
// es válida responden `session_expired` y no leen ni escriben nada (HU2-CA10, E02-D4).

export type MovementCategoriesResult =
  | { status: 'ok'; categories: Category[] }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementFindResult =
  | { status: 'ok'; movement: Movement }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementSaveResult =
  | { status: 'saved'; movement: Movement; category: Category }
  | { status: 'invalid_input'; errors: MovementFieldErrors }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementListResult =
  | { status: 'ok'; movements: MovementListItem[] }
  | { status: 'invalid_filters'; error: MovementFilterError }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementTotalsResult =
  | { status: 'ok'; totals: MovementTotals }
  | { status: 'session_expired' }
  | { status: 'failed' };

export type MovementDeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'session_expired' }
  | { status: 'failed' };

export interface MovementGateway {
  // Categorías del selector (HU4-CA02, HU8-CA08, E07-D1). `includeId` conserva la categoría
  // actual de un movimiento en edición aunque ya no corresponda a su tipo.
  listCategories(
    session: UserSession,
    type: CategoryType,
    includeId?: string,
  ): Promise<MovementCategoriesResult>;
  find(session: UserSession, id: string): Promise<MovementFindResult>;
  list(
    session: UserSession,
    filters: MovementFilterInput,
  ): Promise<MovementListResult>;
  totals(session: UserSession): Promise<MovementTotalsResult>;
  remove(session: UserSession, id: string): Promise<MovementDeleteResult>;
  create(
    session: UserSession,
    input: MovementInput,
  ): Promise<MovementSaveResult>;
  update(
    session: UserSession,
    id: string,
    input: MovementInput,
  ): Promise<MovementSaveResult>;
}

export type MovementManagementDependencies = {
  database: SqlDatabase;
  sessions: SessionManager;
  random?: RandomBytesSource;
  now?: () => number;
};

function failureStatus(error: unknown): 'session_expired' | 'failed' {
  return error instanceof SessionError ? 'session_expired' : 'failed';
}

export class MovementManagementService implements MovementGateway {
  private readonly random: RandomBytesSource;
  private readonly now: () => number;

  constructor(private readonly dependencies: MovementManagementDependencies) {
    this.random = dependencies.random ?? secureRandomBytes;
    this.now = dependencies.now ?? Date.now;
  }

  private categories(
    executor: SqlExecutor = this.dependencies.database,
  ): CategoryRepository {
    return new CategoryRepository(executor, this.dependencies.sessions);
  }

  private movements(
    executor: SqlExecutor = this.dependencies.database,
  ): MovementRepository {
    return new MovementRepository(executor, this.dependencies.sessions);
  }

  async listCategories(
    session: UserSession,
    type: CategoryType,
    includeId?: string,
  ): Promise<MovementCategoriesResult> {
    try {
      const all = await this.categories().listForOwner(session);
      const categories = all.filter(
        category =>
          categoryFitsType(category, type) || category.id === includeId,
      );
      // «Otros» siempre al final, también para ingresos, donde es de otro tipo (E07-D1).
      const other = categories.filter(({ id }) => id === OTHER_CATEGORY_ID);
      return {
        status: 'ok',
        categories: [
          ...categories.filter(({ id }) => id !== OTHER_CATEGORY_ID),
          ...other,
        ],
      };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async find(session: UserSession, id: string): Promise<MovementFindResult> {
    try {
      const movement = await this.movements().findOwn(session, id);
      return movement === null
        ? { status: 'not_found' }
        : { status: 'ok', movement };
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async list(
    session: UserSession,
    filters: MovementFilterInput,
  ): Promise<MovementListResult> {
    const error = validateMovementFilters(filters);
    if (error !== null) {
      return { status: 'invalid_filters', error };
    }
    try {
      const movements = await this.movements().listOwn(session, {
        from: parseDisplayDate(filters.from),
        to: parseDisplayDate(filters.to),
        type: isMovementType(filters.type) ? filters.type : null,
        categoryId: filters.categoryId.length > 0 ? filters.categoryId : null,
      });
      return { status: 'ok', movements };
    } catch (failure) {
      return { status: failureStatus(failure) };
    }
  }

  async totals(session: UserSession): Promise<MovementTotalsResult> {
    try {
      return {
        status: 'ok',
        totals: await this.movements().totalsOwn(session),
      };
    } catch (failure) {
      return { status: failureStatus(failure) };
    }
  }

  async remove(
    session: UserSession,
    id: string,
  ): Promise<MovementDeleteResult> {
    try {
      const deleted = await serializedByDatabase(
        this.dependencies.database,
        () => this.movements().deleteOwn(session, id),
      );
      return { status: deleted ? 'deleted' : 'not_found' };
    } catch (failure) {
      return { status: failureStatus(failure) };
    }
  }

  private today(): string {
    return isoDateFrom(this.now());
  }

  async create(
    session: UserSession,
    input: MovementInput,
  ): Promise<MovementSaveResult> {
    const today = this.today();
    const valid = toValidMovementInput(input, today);
    if (valid === null) {
      return {
        status: 'invalid_input',
        errors: validateMovementInput(input, today),
      };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<MovementSaveResult> => {
            const category = await this.categories(executor).findAccessible(
              session,
              valid.categoryId,
            );
            if (category === null || !categoryFitsType(category, valid.type)) {
              return {
                status: 'invalid_input',
                errors: { categoryId: 'unavailable' },
              };
            }
            const movement = await this.movements(executor).createOwn(
              session,
              randomUuid(this.random),
              valid,
              this.now(),
            );
            return { status: 'saved', movement, category };
          },
        ),
      );
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }

  async update(
    session: UserSession,
    id: string,
    input: MovementInput,
  ): Promise<MovementSaveResult> {
    const today = this.today();
    const valid = toValidMovementInput(input, today);
    if (valid === null) {
      return {
        status: 'invalid_input',
        errors: validateMovementInput(input, today),
      };
    }
    try {
      return await serializedByDatabase(this.dependencies.database, () =>
        this.dependencies.database.transaction(
          async (executor): Promise<MovementSaveResult> => {
            const movements = this.movements(executor);
            const current = await movements.findOwn(session, id);
            if (current === null) {
              return { status: 'not_found' };
            }
            const category = await this.categories(executor).findAccessible(
              session,
              valid.categoryId,
            );
            const unchanged =
              category !== null &&
              category.id === current.categoryId &&
              valid.type === current.type;
            if (
              category === null ||
              (!unchanged && !categoryFitsType(category, valid.type))
            ) {
              return {
                status: 'invalid_input',
                errors: { categoryId: 'unavailable' },
              };
            }
            const now = this.now();
            if (!(await movements.updateOwn(session, id, valid, now))) {
              return { status: 'not_found' };
            }
            return {
              status: 'saved',
              movement: { ...current, ...valid, updatedAt: now },
              category,
            };
          },
        ),
      );
    } catch (error) {
      return { status: failureStatus(error) };
    }
  }
}
