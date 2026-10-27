import { IdentityRepository } from '../../../src/infrastructure/database/repositories/identityRepository';
import { SessionManager } from '../../../src/services/session/sessionManager';
import { login, type LoginResult } from '../../../src/services/login/loginService';
import type { AppServices } from '../../../src/services/bootstrap/appServices';
import {
  createAccount,
  createMigratedDatabase,
  profile,
  TEST_PARAMETERS,
} from '../../../testing/identityFixtures';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../../../testing/nodeSqliteDatabase';

const PASSWORD = 'Clave123!';

async function buildServices(): Promise<AppServices> {
  const database = await createMigratedDatabase();
  const engine = nodePbkdf2Engine;
  const sessions = new SessionManager(nodeRandomBytes);
  return { database, engine, sessions };
}

describe('login service (HU2)', () => {
  test('returns success with a valid session on correct credentials', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    const result = await login('ana@example.com', PASSWORD, services);

    expect(result.status).toBe('success');
    expect((result as Extract<LoginResult, { status: 'success' }>).session).toMatchObject({
      userId: expect.any(String),
      sessionId: expect.any(String),
    });
  });

  test('returns invalid_credentials for nonexistent user', async () => {
    const services = await buildServices();

    const result = await login('noexiste@correo.com', PASSWORD, services);

    expect(result.status).toBe('invalid_credentials');
  });

  test('returns invalid_credentials for wrong password', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    const result = await login('ana@example.com', 'ClaveIncorrecta1!', services);

    expect(result.status).toBe('invalid_credentials');
  });

  test('returns invalid_credentials when password fails candidate check', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    const result = await login('ana@example.com', 'abc', services);

    expect(result).toMatchObject({ status: 'invalid_credentials' });
  });

  test('locks account after 3 consecutive failures (HU2-CA04)', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', 'Mala1234!', services);
    const third = await login('ana@example.com', 'Mala1234!', services);

    expect(third.status).toBe('account_locked');
    expect(
      (third as Extract<LoginResult, { status: 'account_locked' }>).remainingMs,
    ).toBeGreaterThan(0);
  });

  test('locked account rejects even correct password (HU2-CA04)', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', 'Mala1234!', services);

    const result = await login('ana@example.com', PASSWORD, services);

    expect(result.status).toBe('account_locked');
  });

  test('resolves user by document number (HU2-CA01)', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    const result = await login('1001', PASSWORD, services);

    expect(result.status).toBe('success');
  });

  test('resolves user by phone number (HU2-CA01)', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    const result = await login('3001112233', PASSWORD, services);

    expect(result.status).toBe('success');
  });

  test('successful login resets throttle state', async () => {
    const services = await buildServices();
    await createAccount(services.database, profile(), PASSWORD);

    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', PASSWORD, services);

    await login('ana@example.com', 'Mala1234!', services);
    await login('ana@example.com', 'Mala1234!', services);
    const result = await login('ana@example.com', 'Mala1234!', services);

    expect(result.status).toBe('account_locked');
  });
});
