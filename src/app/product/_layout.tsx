/**
 * Dónde Hay - Product Layout
 * Layout para pantallas de producto
 */

import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';

export default function ProductLayout() {
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
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
