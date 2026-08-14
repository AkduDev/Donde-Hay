/**
 * Dónde Hay - Auth Layout
 * Stack de navegación para pantallas de autenticación
 */

import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

export default function AuthLayout() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
