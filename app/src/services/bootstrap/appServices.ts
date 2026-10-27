import type { Pbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import type { SqlDatabase } from '../../infrastructure/database/sqlDatabase';
import type { SessionManager } from '../session/sessionManager';

export type AppServices = {
  database: SqlDatabase;
  engine: Pbkdf2Engine;
  sessions: SessionManager;
};
