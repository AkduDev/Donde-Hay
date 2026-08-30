/**
 * Dónde Hay - Design System
 * Export barrel para todos los tokens de diseño
 */

import { Colors, type ColorMode, type ColorPalette, getColors } from './colors';
import { TypographyVariants } from './typography';
import { Spacing } from './spacing';
import { BorderRadius } from './radius';
import { Shadows, type ShadowLevel, getShadow } from './shadows';
import { ZLayers } from './z-index';

// Re-export todos los tokens (incluye types)
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './breakpoints';
export * from './z-index';

// ============================================
// THEME FACTORY & HOOKS
// ============================================

export interface Theme {
  colors: ColorPalette;
  typography: typeof TypographyVariants;
  spacing: typeof Spacing;
  radius: typeof BorderRadius;
  shadows: typeof Shadows.light;
  zIndex: typeof ZLayers;
  mode: ColorMode;
}

// Theme factory - crea tema completo según modo
export function createTheme(mode: ColorMode = 'light'): Theme {
  return {
    colors: getColors(mode),
    typography: TypographyVariants,
    spacing: Spacing,
    radius: BorderRadius,
    shadows: Shadows[mode],
    zIndex: ZLayers,
    mode,
  };
}

// Default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

// Type para el tema extendido (para TypeScript)
export type DondeHayTheme = Theme;

// CSS-in-JS / NativeWind compatible theme object
export const theme = {
  colors: {
    light: Colors.light,
    dark: Colors.dark,
  },
  typography: TypographyVariants,
  spacing: Spacing,
  radius: BorderRadius,
  shadows: {
    light: Shadows.light,
    dark: Shadows.dark,
  },
  zIndex: ZLayers,
  breakpoints: {
    xs: '0px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Helper para usar en componentes con useTheme hook
export function resolveColor(
  colorToken: keyof ColorPalette,
  mode: ColorMode = 'light'
): string {
  return getColors(mode)[colorToken];
}

export function resolveShadow(
  level: ShadowLevel,
  mode: ColorMode = 'light'
) {
  return getShadow(level, mode);
}

// Theme context types (para React Context)
export interface ThemeContextValue {
  theme: Theme;
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
}