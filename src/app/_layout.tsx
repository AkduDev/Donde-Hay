/**
 * Dónde Hay - Root Layout
 * Layout raíz con providers globales y auth guard
 */

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider, setAuthTokenGetter } from '@/lib/api-client';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getColors } from '@/theme/colors';

setAuthTokenGetter(async () => {
  const state = useAuthStore.getState();
  return state.getAccessToken?.() ?? null;
});

const AUTH_ROUTES = ['login', 'register', 'forgot-password', 'reset-password'];

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { resolvedMode, initialize } = useThemeStore();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const colors = getColors(resolvedMode);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auth guard
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentRoute = segments[segments.length - 1] || '';
    const isAuthRoute = inAuthGroup || AUTH_ROUTES.includes(currentRoute);

    if (!isAuthenticated && !isAuthRoute) {
      // Not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isAuthRoute) {
      // Authenticated, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  // Show nothing while hydrating
  if (!isHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        <Stack
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
      </QueryProvider>
    </SafeAreaProvider>
  );
}
