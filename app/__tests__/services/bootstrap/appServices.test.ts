import type { AppServices } from '../../../src/services/bootstrap/appServices';
import { SessionManager } from '../../../src/services/session/sessionManager';
import {
  createNodeSqliteDatabase,
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';

describe('AppServices type contract', () => {
  test('accepts valid database, engine and sessions', () => {
    const services: AppServices = {
      database: createNodeSqliteDatabase(),
      engine: nodePbkdf2Engine,
      sessions: new SessionManager(nodeRandomBytes),
    };

    expect(services.database).toBeDefined();
    expect(services.engine).toBeDefined();
    expect(services.sessions).toBeInstanceOf(SessionManager);
  });

  test('sessions start and end independently of database', () => {
    const services: AppServices = {
      database: createNodeSqliteDatabase(),
      engine: nodePbkdf2Engine,
      sessions: new SessionManager(nodeRandomBytes),
    };

    const session = services.sessions.start('user-001');
    expect(session.userId).toBe('user-001');
    expect(services.sessions.current()).toBe(session);

    services.sessions.end();
    expect(services.sessions.current()).toBeNull();
  });
});
