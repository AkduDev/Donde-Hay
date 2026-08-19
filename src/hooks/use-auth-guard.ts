/**
 * Dónde Hay - useAuthGuard Hook
 * Guard de autenticación para proteger rutas
 */

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

const AUTH_ROUTES = ['login', 'register', 'forgot-password', 'reset-password'];

/**
 * Hook to protect routes based on auth status.
 * Redirects to login if not authenticated.
 * Redirects to home if authenticated and trying to access auth routes.
 */
export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentRoute = segments[segments.length - 1] ?? '';
    const isAuthRoute = inAuthGroup || AUTH_ROUTES.includes(currentRoute);

    if (!isAuthenticated && !isAuthRoute) {
      // Not authenticated, trying to access protected route
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isAuthRoute) {
      // Authenticated, trying to access auth route
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, segments, router]);
}

/**
 * Hook to get the initial route based on auth status.
 * Used by the root layout to set the initial screen.
 */
export function useInitialRoute(): string {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return '/'; // Loading state
  }

  return isAuthenticated ? '/(tabs)' : '/(auth)/login';
}
