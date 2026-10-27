import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppServicesContext } from './src/presentation/AppServicesContext';
import { Navigator } from './src/presentation/navigation/Navigator';
import { StatusScreen } from './src/presentation/screens/StatusScreen';
import { openNativeAppServices } from './src/services/bootstrap/openNativeAppServices';
import type { AppServices } from './src/services/bootstrap/appServices';

type BootState =
  | { phase: 'loading' }
  | { phase: 'ready'; services: AppServices }
  | { phase: 'error'; message: string };

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [boot, setBoot] = useState<BootState>({ phase: 'loading' });

  const initialize = useCallback(async () => {
    setBoot({ phase: 'loading' });
    try {
      const services = await openNativeAppServices();
      setBoot({ phase: 'ready', services });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error desconocido';
      setBoot({ phase: 'error', message: msg });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {boot.phase === 'loading' && <StatusScreen kind="loading" />}
      {boot.phase === 'error' && (
        <StatusScreen
          kind="error"
          message={boot.message}
          onRetry={initialize}
        />
      )}
      {boot.phase === 'ready' && (
        <AppServicesContext.Provider value={boot.services}>
          <Navigator />
        </AppServicesContext.Provider>
      )}
    </SafeAreaProvider>
  );
}

export default App;
