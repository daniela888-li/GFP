import React, { useCallback, useState } from 'react';
import { LoginScreen } from '../screens/login/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PendingScreen } from '../screens/PendingScreen';
import { ROUTES, type RouteName } from './routes';
import { useAppServices } from '../AppServicesContext';

export function Navigator() {
  const services = useAppServices();
  const [currentRoute, setCurrentRoute] = useState<RouteName>('login');
  const [authenticated, setAuthenticated] = useState(false);

  const handleLoginSuccess = useCallback(() => {
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    services.sessions.end();
    setAuthenticated(false);
    setCurrentRoute('login');
  }, [services]);

  const navigateTo = useCallback((route: RouteName) => {
    setCurrentRoute(route);
  }, []);

  const goBack = useCallback(() => {
    if (authenticated) {
      setCurrentRoute('login');
    } else {
      setCurrentRoute('login');
    }
  }, [authenticated]);

  if (authenticated && currentRoute !== 'login') {
    const routeInfo = ROUTES[currentRoute];
    return <PendingScreen route={routeInfo} onGoBack={goBack} />;
  }

  if (authenticated) {
    return <HomeScreen onLogout={handleLogout} />;
  }

  switch (currentRoute) {
    case 'login':
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => navigateTo('registration')}
          onNavigateRecovery={() => navigateTo('passwordRecovery')}
        />
      );
    case 'registration': {
      const regRoute = ROUTES.registration;
      return <PendingScreen route={regRoute} onGoBack={goBack} />;
    }
    case 'passwordRecovery': {
      const recRoute = ROUTES.passwordRecovery;
      return <PendingScreen route={recRoute} onGoBack={goBack} />;
    }
    default: {
      const info = ROUTES[currentRoute];
      return <PendingScreen route={info} onGoBack={goBack} />;
    }
  }
}
