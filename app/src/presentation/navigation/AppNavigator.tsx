import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, View } from 'react-native';
import type { AppServices } from '../../services/appServices';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoriesScreen } from '../categories/CategoriesScreen';
import { BottomTabs } from '../components/BottomTabs';
import { LoginScreen } from '../login/LoginScreen';
import {
  MovementFormScreen,
  type MovementSummary,
} from '../movements/MovementFormScreen';
import { MovementHistoryScreen } from '../movements/MovementHistoryScreen';
import { MovementSuccessScreen } from '../movements/MovementSuccessScreen';
import { MOVEMENT_TEXTS } from '../movements/movementTexts';
import { PasswordRecoveryScreen } from '../recovery/PasswordRecoveryScreen';
import { RegistrationWizard } from '../registration/RegistrationWizard';
import { ProvisionalScreen } from '../screens/ProvisionalScreen';
import {
  AUTHENTICATED_HOME_ROUTE,
  INITIAL_ROUTE,
  ROUTE_DEFINITIONS,
  ROUTES,
  type RouteName,
} from './routes';

// Una ruta que exige sesión solo se muestra con la sesión activa del SessionManager; en
// otro caso se muestra el inicio de sesión (HU2-CA10).
export function resolveRoute(
  route: RouteName,
  session: UserSession | null,
  activeSession: UserSession | null,
): RouteName {
  const authenticated = session !== null && session === activeSession;
  return ROUTE_DEFINITIONS[route].requiresSession && !authenticated
    ? ROUTES.login
    : route;
}

const LAYOUT = { flex: 1 } as const;

export function AppNavigator({ services }: { services: AppServices }) {
  const [route, setRoute] = useState<RouteName>(INITIAL_ROUTE);
  const [session, setSession] = useState<UserSession | null>(null);
  const [savedMovement, setSavedMovement] = useState<MovementSummary | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const visible = resolveRoute(route, session, services.sessions.current());
  const expireSession = useCallback(() => {
    setSession(null);
    setRoute(ROUTES.login);
  }, []);
  const backToHistory = useCallback(() => {
    setSavedMovement(null);
    setEditingId(null);
    setRoute(ROUTES.movementHistory);
  }, []);
  // Las pantallas provisionales vuelven al historial con el botón Atrás de Android. En el
  // historial, Atrás conserva el comportamiento del sistema y no regresa al inicio de sesión.
  useEffect(() => {
    if (ROUTE_DEFINITIONS[visible].implemented) {
      return undefined;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        backToHistory();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible, backToHistory]);
  const openTab = (tab: RouteName) => {
    setSavedMovement(null);
    setEditingId(null);
    setRoute(tab);
  };
  const withTabs = (content: ReactNode) => (
    <View style={LAYOUT}>
      <View style={LAYOUT}>{content}</View>
      <BottomTabs
        active={
          visible === ROUTES.financialAnalysis ||
          visible === ROUTES.recommendations
            ? visible
            : ROUTES.movementHistory
        }
        tabs={[
          {
            key: ROUTES.movementHistory,
            label: MOVEMENT_TEXTS.tabs.movements,
            onPress: () => openTab(ROUTES.movementHistory),
          },
          {
            key: ROUTES.financialAnalysis,
            label: MOVEMENT_TEXTS.tabs.analysis,
            onPress: () => openTab(ROUTES.financialAnalysis),
          },
          {
            key: ROUTES.recommendations,
            label: MOVEMENT_TEXTS.tabs.recommendations,
            onPress: () => openTab(ROUTES.recommendations),
          },
        ]}
      />
    </View>
  );
  if (visible === ROUTES.register) {
    return (
      <RegistrationWizard
        gateway={services.registration}
        onNavigate={setRoute}
      />
    );
  }
  if (visible === ROUTES.login) {
    return (
      <LoginScreen
        gateway={services.login}
        onAuthenticated={started => {
          setSession(started);
          setRoute(AUTHENTICATED_HOME_ROUTE);
        }}
        onNavigate={setRoute}
      />
    );
  }
  if (visible === ROUTES.passwordRecovery) {
    return (
      <PasswordRecoveryScreen
        gateway={services.recovery}
        onNavigate={setRoute}
      />
    );
  }
  if (visible === ROUTES.categories && session !== null) {
    return (
      <CategoriesScreen
        gateway={services.categories}
        onBack={() => setRoute(ROUTES.movementHistory)}
        onSessionExpired={expireSession}
        session={session}
      />
    );
  }
  if (visible === ROUTES.movementForm && session !== null) {
    return withTabs(
      savedMovement !== null ? (
        <MovementSuccessScreen onBack={backToHistory} summary={savedMovement} />
      ) : (
        <MovementFormScreen
          gateway={services.movements}
          key={editingId ?? 'new'}
          movementId={editingId ?? undefined}
          onCancel={backToHistory}
          onCreated={setSavedMovement}
          onSessionExpired={expireSession}
          session={session}
        />
      ),
    );
  }
  if (visible === ROUTES.movementHistory && session !== null) {
    return withTabs(
      <MovementHistoryScreen
        categories={services.categories}
        gateway={services.movements}
        onEdit={id => {
          setEditingId(id);
          setRoute(ROUTES.movementForm);
        }}
        onNavigate={setRoute}
        onSessionExpired={expireSession}
        session={session}
      />,
    );
  }
  return withTabs(<ProvisionalScreen route={ROUTE_DEFINITIONS[visible]} />);
}
