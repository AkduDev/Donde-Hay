/**
 * Dónde Hay - useTheme Hook
 * Returns the current theme colors based on color scheme
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, type ColorPalette } from '@/theme/colors';

export function useTheme(): ColorPalette {
  const scheme = useColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  return getColors(mode);
}

export function useThemeMode(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
