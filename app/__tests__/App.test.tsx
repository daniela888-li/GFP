import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import App from '../App';
import { DatabaseOpenError } from '../src/infrastructure/database/encryptedDatabase';
import { MigrationError } from '../src/infrastructure/database/migrator';
import { resolveRoute } from '../src/presentation/navigation/AppNavigator';
import {
  ROUTE_DEFINITIONS,
  type RouteName,
} from '../src/presentation/navigation/routes';
import type { ReceiptGateway } from '../src/processing/receiptGateway';
import { MovementManagementService } from '../src/business/movements/movementManagement';
import { CategoryManagementService } from '../src/business/categories/categoryManagement';
import { AccountLoginService } from '../src/services/authentication/accountLogin';
import { AccountRecoveryService } from '../src/services/authentication/accountRecovery';
import { AccountRegistrationService } from '../src/services/authentication/accountRegistration';
import { SessionManager } from '../src/services/session/sessionManager';
import {
  nodePbkdf2Engine,
  nodeRandomBytes,
} from '../testing/nodeSqliteDatabase';
import {
  createAccount,
  createMigratedDatabase,
  DEFAULT_ANSWERS,
  profile,
  TEST_PARAMETERS,
} from '../testing/identityFixtures';

jest.mock('../src/services/nativeAppServices', () => ({
  createNativeAppServices: jest.fn(),
}));

jest.setTimeout(20_000);

async function readyServices(withAccount = false) {
  const database = await createMigratedDatabase();
  if (withAccount) {
    await createAccount(database, profile());
  }
  const sessions = new SessionManager(nodeRandomBytes);
  const dependencies = {
    database,
    engine: nodePbkdf2Engine,
    random: nodeRandomBytes,
    parameters: TEST_PARAMETERS,
  };
  return {
    registration: new AccountRegistrationService(dependencies),
    login: new AccountLoginService({ ...dependencies, sessions }),
    recovery: new AccountRecoveryService(dependencies),
    sessions,
    categories: new CategoryManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    }),
    movements: new MovementManagementService({
      database,
      sessions,
      random: nodeRandomBytes,
    }),
    receipts: FAKE_RECEIPTS,
  };
}

const FAKE_RECEIPTS: ReceiptGateway = {
  takePhoto: async () => null,
  pickFromGallery: async () => ({
    uri: 'file:///factura.jpg',
    fileName: 'factura.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1000,
  }),
  recognizeText: async () =>
    'Supermercado La Canasta\nFecha: 01/01/2026\nTOTAL 45.500',
};

describe('App startup and navigation (A-W9, G-07, HU2)', () => {
  test('opens the database at startup and starts in the HU2 login screen', async () => {
    const createServices = jest.fn(() => readyServices());
    await render(<App createServices={createServices} />);
    expect(screen.getByTestId('app-base')).toBeTruthy();
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByText('Iniciar sesión')).toBeTruthy();
    expect(createServices).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['a lost key', new DatabaseOpenError('key_lost')],
    ['a rejected key', new DatabaseOpenError('key_rejected')],
    ['missing SQLCipher', new DatabaseOpenError('cipher_unavailable')],
    ['a newer schema', new MigrationError('newer_schema', 9)],
    ['an unexpected error', new Error('boom')],
  ])(
    'blocks every database feature after %s and shows the approved message',
    async (_label, error) => {
      await render(<App createServices={() => Promise.reject(error)} />);
      expect(
        await screen.findByText(
          'No fue posible abrir la base de datos. Reinicia la aplicación.',
        ),
      ).toBeTruthy();
      expect(screen.queryByTestId('registration-wizard')).toBeNull();
      expect(screen.queryByTestId('login-screen')).toBeNull();
      expect(screen.queryByText(/soporte/i)).toBeNull();
    },
  );

  test('HU2-CA08: «Registrar» opens the registration wizard', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-register'));
    expect(await screen.findByText('Paso 1 de 3')).toBeTruthy();
  });

  test('HU1-CA18 regression: «Cancelar» returns to the HU2 login screen with empty fields', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-register'));
    await screen.findByText('Paso 1 de 3');
    await fireEvent.changeText(
      screen.getByTestId('registration-firstName'),
      'Ana',
    );
    await fireEvent.press(screen.getByTestId('registration-cancel'));
    expect(screen.getByTestId('login-screen')).toBeTruthy();
    expect(screen.queryByTestId('provisional-HU2')).toBeNull();
    expect(screen.getByTestId('login-identifier').props.value).toBe('');
    expect(screen.getByTestId('login-password').props.value).toBe('');
  });

  test('HU2-CA09: «Olvidé mi contraseña» opens the HU3 recovery form', async () => {
    await render(<App createServices={() => readyServices()} />);
    await fireEvent.press(await screen.findByTestId('login-forgot-password'));
    expect(screen.getByTestId('recovery-screen')).toBeTruthy();
    expect(screen.queryByTestId('provisional-HU3')).toBeNull();
  });

  test('HU3-CA12, CA13: after a successful recovery the app returns to the login form and the new password logs in', async () => {
    const services = await readyServices(true);
    const catalog = await services.recovery.listSecurityQuestions();
    await render(<App createServices={() => Promise.resolve(services)} />);
    await fireEvent.press(await screen.findByTestId('login-forgot-password'));
    await fireEvent.changeText(
      screen.getByTestId('recovery-identifier'),
      'ana@example.com',
    );
    await fireEvent.press(screen.getByTestId('recovery-start'));
    await screen.findByTestId('recovery-challenge');
    for (const index of [0, 1]) {
      const field = screen.getByTestId(`recovery-answer-${index}`);
      const questionId = catalog.find(
        question => question.prompt === field.props.accessibilityLabel,
      )!.id;
      await fireEvent.changeText(
        field,
        DEFAULT_ANSWERS.find(answer => answer.questionId === questionId)!
          .answer,
      );
    }
    await fireEvent.changeText(
      screen.getByTestId('recovery-new-password'),
      'Nueva clave 9#',
    );
    await fireEvent.changeText(
      screen.getByTestId('recovery-confirmation'),
      'Nueva clave 9#',
    );
    await fireEvent.press(screen.getByTestId('recovery-update'));
    await fireEvent.press(await screen.findByTestId('dialog-accept'));
    expect(screen.getByTestId('login-screen')).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId('login-identifier'),
      'ana@example.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Nueva clave 9#',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
  });

  test('HU2-CA07, CA10: a valid login opens the authenticated home route', async () => {
    await render(<App createServices={() => readyServices(true)} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    expect(screen.queryByTestId('login-screen')).toBeNull();
  });

  test('HU2-CA10: routes with financial data need the active session', () => {
    const sessions = new SessionManager(nodeRandomBytes);
    const protectedRoutes = (
      Object.keys(ROUTE_DEFINITIONS) as RouteName[]
    ).filter(route => ROUTE_DEFINITIONS[route].requiresSession);
    expect(protectedRoutes).toEqual([
      'movementForm',
      'movementHistory',
      'receiptCapture',
      'categories',
      'financialAnalysis',
      'recommendations',
    ]);
    const first = sessions.start('user-1');
    for (const route of protectedRoutes) {
      expect(resolveRoute(route, null, null)).toBe('login');
      expect(resolveRoute(route, first, first)).toBe(route);
    }
    const second = sessions.start('user-2');
    expect(resolveRoute('movementHistory', first, second)).toBe('login');
    sessions.end();
    expect(resolveRoute('movementHistory', second, null)).toBe('login');
    expect(resolveRoute('register', null, null)).toBe('register');
    expect(resolveRoute('passwordRecovery', null, null)).toBe(
      'passwordRecovery',
    );
  });

  test('the route registry declares HU1 to HU10 and all stories with a route are implemented', () => {
    const stories = Object.values(ROUTE_DEFINITIONS).map(route => route.story);
    expect(stories).toEqual([
      'HU1',
      'HU2',
      'HU3',
      'HU4',
      'HU5',
      'HU7',
      'HU8',
      'HU9',
      'HU10',
    ]);
    expect(
      Object.values(ROUTE_DEFINITIONS)
        .filter(route => route.implemented)
        .map(route => route.story),
    ).toEqual(['HU1', 'HU2', 'HU3', 'HU4', 'HU5', 'HU7', 'HU8', 'HU9', 'HU10']);
  });
});

describe('HU8 access from the history (E06-D4)', () => {
  test('after logging in, «Categorías» opens the categories screen and the Android back button returns', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    await render(<App createServices={() => readyServices(true)} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    await fireEvent.press(await screen.findByTestId('open-categories'));
    expect(await screen.findByTestId('categories-screen')).toBeTruthy();
    expect(await screen.findByText('Alimentación')).toBeTruthy();
    await act(async () => {
      listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 });
    });
    expect(screen.getByTestId('movement-history')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('HU4 flow from the history (E07-D3, E07-D4, E07-D7)', () => {
  async function login() {
    await render(<App createServices={() => readyServices(true)} />);
    await fireEvent.changeText(
      await screen.findByTestId('login-identifier'),
      '1001',
    );
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'Clave123!',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
    await screen.findByTestId('movement-history');
  }

  test('saves a movement, confirms it and returns to the history', async () => {
    await login();
    await fireEvent.press(screen.getByTestId('open-movement-form'));
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '45000',
    );
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(
      await screen.findByTestId('movement-category-option-food'),
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    expect(await screen.findByTestId('movement-success')).toBeTruthy();
    expect(
      screen.getByText('El movimiento fue registrado exitosamente'),
    ).toBeTruthy();
    expect(screen.getByTestId('movement-success-amount')).toHaveTextContent(
      '-$45.000,00',
    );
    await fireEvent.press(screen.getByTestId('movement-back-to-history'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('open-movement-form'));
    expect((await screen.findByTestId('movement-amount')).props.value).toBe('');
  });

  test('the bottom bar opens Análisis and Recomendaciones', async () => {
    await login();
    await fireEvent.press(screen.getByTestId('tab-financialAnalysis'));
    expect(await screen.findByTestId('analysis-screen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    expect(await screen.findByTestId('recommendations-screen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-movementHistory'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
  });

  test('HU5-CA07 and HU4-CA10: Editar opens the form with the data and Cancelar returns', async () => {
    await login();
    await fireEvent.press(screen.getByTestId('open-movement-form'));
    await fireEvent.changeText(
      await screen.findByTestId('movement-amount'),
      '700',
    );
    await fireEvent.press(screen.getByTestId('movement-category'));
    await fireEvent.press(
      await screen.findByTestId('movement-category-option-food'),
    );
    await fireEvent.press(screen.getByTestId('movement-save'));
    await fireEvent.press(
      await screen.findByTestId('movement-back-to-history'),
    );
    await fireEvent.press(await screen.findByText('✏️ Editar'));
    expect(await screen.findByText('Editar movimiento')).toBeTruthy();
    expect(screen.getByTestId('movement-amount').props.value).toBe('700');
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
  });

  test('the Android back button returns from Recomendaciones to the history', async () => {
    const listeners: Array<Parameters<typeof BackHandler.addEventListener>[1]> =
      [];
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });
    await login();
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    await screen.findByTestId('recommendations-screen');
    await act(async () => {
      listeners.at(-1)!({ type: 'hardwareBackPress', timeStamp: 0 });
    });
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    spy.mockRestore();
  });

  test('HU7: the OCR data reaches the form and nothing is saved until confirming', async () => {
    await login();
    await fireEvent.press(screen.getByTestId('open-receipt-capture'));
    await fireEvent.press(await screen.findByTestId('receipt-pick-gallery'));
    await fireEvent.press(await screen.findByTestId('receipt-continue'));
    expect((await screen.findByTestId('movement-amount')).props.value).toBe(
      '45500',
    );
    expect(screen.getByTestId('movement-description').props.value).toBe(
      'Supermercado La Canasta',
    );
    await fireEvent.press(screen.getByTestId('movement-cancel'));
    expect(await screen.findByTestId('balance-expense')).toHaveTextContent(
      '$0,00',
    );
  });

  test('E13-D2: Atrás and Adelante walk the visited screens', async () => {
    await login();
    expect(screen.getByTestId('nav-back').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    await fireEvent.press(screen.getByTestId('tab-financialAnalysis'));
    await screen.findByTestId('analysis-screen');
    await fireEvent.press(screen.getByTestId('tab-recommendations'));
    await screen.findByTestId('recommendations-screen');
    await fireEvent.press(screen.getByTestId('nav-back'));
    expect(await screen.findByTestId('analysis-screen')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('nav-back'));
    expect(await screen.findByTestId('movement-history')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('nav-forward'));
    expect(await screen.findByTestId('analysis-screen')).toBeTruthy();
  });

  test('E13-D3: Cerrar sesión asks, ends the session and protects the routes', async () => {
    await login();
    await fireEvent.press(screen.getByTestId('nav-logout'));
    await fireEvent.press(await screen.findByTestId('logout-cancel'));
    expect(screen.getByTestId('movement-history')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('nav-logout'));
    await fireEvent.press(await screen.findByTestId('logout-confirm'));
    expect(await screen.findByTestId('login-identifier')).toBeTruthy();
    expect(screen.queryByTestId('top-bar')).toBeNull();
  });
});
