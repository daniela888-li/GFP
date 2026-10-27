import { createNativeDatabaseDependencies } from '../../infrastructure/database/nativeDatabaseDependencies';
import { openEncryptedDatabase } from '../../infrastructure/database/encryptedDatabase';
import { createNativePbkdf2Engine } from '../../infrastructure/security/pbkdf2Engine';
import { SessionManager } from '../session/sessionManager';
import type { AppServices } from './appServices';

export async function openNativeAppServices(): Promise<AppServices> {
  const dependencies = createNativeDatabaseDependencies();
  const database = await openEncryptedDatabase(dependencies);
  const engine = createNativePbkdf2Engine();
  const sessions = new SessionManager();

  return { database, engine, sessions };
}
