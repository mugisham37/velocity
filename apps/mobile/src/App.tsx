import { ApolloProvider } from '@apollo/client';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

import { AppNavigator } from '@navigation/AppNavigator';
import { apolloClient } from '@services/apollo';
import { notificationService } from '@services/notifications';
import { syncService } from '@services/sync';
import { useAuthStore } from '@store/auth';
import { store } from '@store/index';
import { theme } from '@utils/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          // Add custom fonts here if needed
        });

        // Initialize authentication
        await initializeAuth();

        // Initialize sync service
        await syncService.initialize();

        // Initialize notifications
        await notificationService.initialize();

        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initializeAuth]);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <NavigationContainer onReady={onLayoutRootView}>
            <AppNavigator />
            <StatusBar style='auto' />
          </NavigationContainer>
        </PaperProvider>
      </ApolloProvider>
    </ReduxProvider>
  );
}
