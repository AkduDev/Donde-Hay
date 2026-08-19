/**
 * Dónde Hay - Profile Layout
 * Layout para pantallas de perfil
 */

import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

export default function ProfileLayout() {
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
      <Stack.Screen name="edit" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
