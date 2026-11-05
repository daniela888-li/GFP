import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, View } from 'react-native';
import type { AppServices } from '../../services/appServices';
import type { UserSession } from '../../services/session/sessionManager';
import { CategoriesScreen } from '../categories/CategoriesScreen';
import type { MovementFilterInput } from '../../business/movements/movementRules';
import { AnalysisScreen } from '../analysis/AnalysisScreen';
import { BottomTabs } from '../components/BottomTabs';
import { MessageDialog } from '../components/MessageDialog';
import { TopBar } from '../components/TopBar';
import { LoginScreen } from '../login/LoginScreen';
import {
  MovementFormScreen,
  type MovementPrefill,
  type MovementSummary,
} from '../movements/MovementFormScreen';
import { MovementHistoryScreen } from '../movements/MovementHistoryScreen';
import { MovementSuccessScreen } from '../movements/MovementSuccessScreen';
import { MOVEMENT_TEXTS } from '../movements/movementTexts';
import { PasswordRecoveryScreen } from '../recovery/PasswordRecoveryScreen';
import { ReceiptCaptureScreen } from '../receipts/ReceiptCaptureScreen';
import { RecommendationsScreen } from '../recommendations/RecommendationsScreen';
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
  const [prefill, setPrefill] = useState<MovementPrefill | null>(null);
  const [historyFilters, setHistoryFilters] =
    useState<MovementFilterInput | null>(null);
  // Recorrido de la sesión para Atrás y Adelante (E13-D2).
  const [past, setPast] = useState<readonly RouteName[]>([]);
  const [future, setFuture] = useState<readonly RouteName[]>([]);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const visible = resolveRoute(route, session, services.sessions.current());
  const clearScreenData = useCallback(() => {
    setSavedMovement(null);
    setEditingId(null);
    setPrefill(null);
    setHistoryFilters(null);
  }, []);
  const go = useCallback(
    (next: RouteName) => {
      if (next !== route) {
        setPast(current => [...current, route]);
        setFuture([]);
      }
      setRoute(next);
    },
    [route],
  );
  const leaveSession = useCallback(() => {
    clearScreenData();
    setPast([]);
    setFuture([]);
    setConfirmingLogout(false);
    setSession(null);
    setRoute(ROUTES.login);
  }, [clearScreenData]);
  const expireSession = leaveSession;
  const backToHistory = useCallback(() => {
    clearScreenData();
    go(ROUTES.movementHistory);
  }, [clearScreenData, go]);
  const openFilteredHistory = useCallback(
    (filters: MovementFilterInput) => {
      setHistoryFilters(filters);
      go(ROUTES.movementHistory);
    },
    [go],
  );
  const goBack = () => {
    const previous = past[past.length - 1];
    if (previous !== undefined) {
      clearScreenData();
      setPast(past.slice(0, -1));
      setFuture([route, ...future]);
      setRoute(previous);
    }
  };
  const goForward = () => {
    const [next, ...rest] = future;
    if (next !== undefined) {
      clearScreenData();
      setPast([...past, route]);
      setFuture(rest);
      setRoute(next);
    }
  };
  // Análisis y Recomendaciones vuelven al historial con el botón Atrás de Android. En el
  // historial, Atrás conserva el comportamiento del sistema y no regresa al inicio de sesión.
  useEffect(() => {
    if (
      visible !== ROUTES.financialAnalysis &&
      visible !== ROUTES.recommendations
    ) {
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
    clearScreenData();
    go(tab);
  };
  const withTabs = (content: ReactNode) => (
    <View style={LAYOUT}>
      <TopBar
        backLabel={MOVEMENT_TEXTS.navigation.back}
        canGoBack={past.length > 0}
        canGoForward={future.length > 0}
        forwardLabel={MOVEMENT_TEXTS.navigation.forward}
        logoutLabel={MOVEMENT_TEXTS.navigation.logout}
        onBack={goBack}
        onForward={goForward}
        onLogout={() => setConfirmingLogout(true)}
      />
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
      {confirmingLogout && (
        <MessageDialog
          actions={[
            {
              label: MOVEMENT_TEXTS.navigation.cancel,
              onPress: () => setConfirmingLogout(false),
              testID: 'logout-cancel',
              variant: 'secondary',
            },
            {
              label: MOVEMENT_TEXTS.navigation.confirm,
              onPress: () => {
                services.sessions.end();
                leaveSession();
              },
              testID: 'logout-confirm',
            },
          ]}
          message={MOVEMENT_TEXTS.navigation.logoutQuestion}
          onRequestClose={() => setConfirmingLogout(false)}
          testID="logout-dialog"
        />
      )}
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
    return withTabs(
      <CategoriesScreen
        gateway={services.categories}
        onBack={backToHistory}
        onSessionExpired={expireSession}
        session={session}
      />,
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
          prefill={prefill ?? undefined}
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
        initialFilters={historyFilters ?? undefined}
        key={JSON.stringify(historyFilters)}
        onEdit={id => {
          setEditingId(id);
          go(ROUTES.movementForm);
        }}
        onNavigate={next => {
          setHistoryFilters(null);
          go(next);
        }}
        onSessionExpired={expireSession}
        session={session}
      />,
    );
  }
  if (visible === ROUTES.receiptCapture) {
    return withTabs(
      <ReceiptCaptureScreen
        gateway={services.receipts}
        onCancel={backToHistory}
        onContinue={data => {
          setPrefill(data);
          go(ROUTES.movementForm);
        }}
      />,
    );
  }
  if (visible === ROUTES.financialAnalysis && session !== null) {
    return withTabs(
      <AnalysisScreen
        gateway={services.movements}
        onNewMovement={() => go(ROUTES.movementForm)}
        onOpenHistory={openFilteredHistory}
        onSessionExpired={expireSession}
        session={session}
      />,
    );
  }
  if (visible === ROUTES.recommendations && session !== null) {
    return withTabs(
      <RecommendationsScreen
        gateway={services.movements}
        onOpenHistory={openFilteredHistory}
        onSessionExpired={expireSession}
        session={session}
      />,
    );
  }
  return withTabs(<ProvisionalScreen route={ROUTE_DEFINITIONS[visible]} />);
}
