import { IdentityRepository } from '../../infrastructure/database/repositories/identityRepository';
import {
  isLocked,
  LOGIN_THROTTLE_POLICY,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  EMPTY_THROTTLE_STATE,
  type ThrottleState,
} from '../authentication/attemptThrottle';
import { isVerifiableCandidate } from '../authentication/passwordPolicy';
import { verifySecret } from '../authentication/secretVerifier';
import type { UserSession } from '../session/sessionManager';
import type { AppServices } from '../bootstrap/appServices';

export type LoginResult =
  | { status: 'success'; session: UserSession }
  | { status: 'invalid_credentials' }
  | { status: 'account_locked'; remainingMs: number };

export async function login(
  identifier: string,
  password: string,
  services: AppServices,
): Promise<LoginResult> {
  const now = Date.now();
  const identity = new IdentityRepository(services.database);

  const userId = await identity.findUserIdByIdentifier(identifier);

  if (userId === null) {
    return { status: 'invalid_credentials' };
  }

  const throttle =
    (await identity.getThrottle('login', userId)) ?? EMPTY_THROTTLE_STATE;

  if (isLocked(throttle, now)) {
    return {
      status: 'account_locked',
      remainingMs: remainingLockMs(throttle, now),
    };
  }

  if (!isVerifiableCandidate(password)) {
    const updatedState = registerFailure(throttle, LOGIN_THROTTLE_POLICY, now);
    await identity.saveThrottle('login', userId, updatedState);
    return buildFailureResult(updatedState, now);
  }

  const credential = await identity.getCredential(userId);

  if (credential === null) {
    return { status: 'invalid_credentials' };
  }

  const valid = await verifySecret(password, credential, services.engine);

  if (!valid) {
    const updatedState = registerFailure(throttle, LOGIN_THROTTLE_POLICY, now);
    await identity.saveThrottle('login', userId, updatedState);
    return buildFailureResult(updatedState, now);
  }

  const successState = registerSuccess();
  await identity.saveThrottle('login', userId, successState);

  const session = services.sessions.start(userId);
  return { status: 'success', session };
}

function buildFailureResult(
  state: ThrottleState,
  now: number,
): LoginResult {
  if (isLocked(state, now)) {
    return {
      status: 'account_locked',
      remainingMs: remainingLockMs(state, now),
    };
  }
  return { status: 'invalid_credentials' };
}
