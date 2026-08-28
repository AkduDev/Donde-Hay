/**
 * Dónde Hay - Root Layout
 * Layout raíz con providers globales
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider, setAuthTokenGetter } from '@/lib/api-client';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getColors } from '@/theme/colors';

setAuthTokenGetter(async () => {
  const state = useAuthStore.getState();
  return state.getAccessToken?.() ?? null;
});

export default function RootLayout() {
  const { resolvedMode, initialize } = useThemeStore();
  const { isHydrated } = useAuthStore();
  const colors = getColors(resolvedMode);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show nothing while hydrating
  if (!isHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('[ErrorBoundary]', error, errorInfo);
          }}
        >
          <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
          <Stack
            initialRouteName="(tabs)"
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="publish" />
          </Stack>
          <ToastContainer />
        </ErrorBoundary>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
