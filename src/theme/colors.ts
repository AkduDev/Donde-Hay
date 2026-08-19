/**
 * Dónde Hay - Design System Colors
 * Paleta oficial según blueprint del producto
 */

export const Colors = {
  // ===== LIGHT MODE =====
  light: {
    // Primary - Azul DevParadise (tecnología/confianza)
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#3B82F6',
    primaryContainer: '#DBEAFE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1E3A8A',

    // Accent - Verde (disponibilidad/encontrado/oportunidad)
    accent: '#00C896',
    accentDark: '#00A67C',
    accentLight: '#00D9A5',
    accentContainer: '#D1FAE5',
    onAccent: '#FFFFFF',
    onAccentContainer: '#064E3B',

    // Background & Surface
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    surfaceContainer: '#FFFFFF',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerHighest: '#CBD5E1',

    // Text
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#F8FAFC',
    textOnPrimary: '#FFFFFF',
    textOnAccent: '#FFFFFF',

    // Border & Divider
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    divider: '#E2E8F0',

    // Semantic
    success: '#22C55E',
    successContainer: '#DCFCE7',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#14532D',

    warning: '#F59E0B',
    warningContainer: '#FEF3C7',
    onWarning: '#FFFFFF',
    onWarningContainer: '#78350F',

    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onError: '#FFFFFF',
    onErrorContainer: '#7F1D1D',

    // Status specific (para disponibilidad de productos)
    statusAvailable: '#22C55E',      // 🟢 Publicación reciente
    statusOld: '#F59E0B',            // 🟡 Publicación antigua
    statusUnknown: '#94A3B8',        // ⚪ Sin información reciente

    // Overlay & Shadow
    overlay: 'rgba(15, 23, 42, 0.5)',
    shadow: '#0F172A',

    // Input
    inputBackground: '#FFFFFF',
    inputBorder: '#E2E8F0',
    inputBorderFocus: '#2563EB',
    inputPlaceholder: '#94A3B8',
    inputError: '#EF4444',

    // Disabled
    disabled: '#94A3B8',
    disabledBackground: '#F1F5F9',

    // Transparent
    transparent: 'transparent',
  },

  // ===== DARK MODE =====
  dark: {
    // Primary - Azul más brillante para modo oscuro
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    primaryContainer: '#1E3A8A',
    onPrimary: '#0F172A',
    onPrimaryContainer: '#DBEAFE',

    // Accent - Verde más brillante para destacar en oscuro
    accent: '#00D9A5',
    accentDark: '#00C896',
    accentLight: '#34D399',
    accentContainer: '#064E3B',
    onAccent: '#07111F',
    onAccentContainer: '#D1FAE5',

    // Background & Surface
    background: '#07111F',
    surface: '#0D1B2A',
    surfaceVariant: '#12263A',
    surfaceContainer: '#0D1B2A',
    surfaceContainerHigh: '#1E293B',
    surfaceContainerHighest: '#334155',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    textOnPrimary: '#0F172A',
    textOnAccent: '#07111F',

    // Border & Divider
    border: '#1E293B',
    borderStrong: '#334155',
    divider: '#1E293B',

    // Semantic
    success: '#22C55E',
    successContainer: '#14532D',
    onSuccess: '#07111F',
    onSuccessContainer: '#DCFCE7',

    warning: '#F59E0B',
    warningContainer: '#78350F',
    onWarning: '#07111F',
    onWarningContainer: '#FEF3C7',

    error: '#EF4444',
    errorContainer: '#7F1D1D',
    onError: '#F8FAFC',
    onErrorContainer: '#FEE2E2',

    // Status specific
    statusAvailable: '#22C55E',
    statusOld: '#F59E0B',
    statusUnknown: '#64748B',

    // Overlay & Shadow
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',

    // Input
    inputBackground: '#12263A',
    inputBorder: '#1E293B',
    inputBorderFocus: '#3B82F6',
    inputPlaceholder: '#64748B',
    inputError: '#EF4444',

    // Disabled
    disabled: '#475569',
    disabledBackground: '#1E293B',

    // Transparent
    transparent: 'transparent',
  },
} as const;

export type ColorMode = 'light' | 'dark';
export type ColorPalette = typeof Colors.light;

// Helper para obtener colores según modo
export function getColors(mode: ColorMode): ColorPalette {
  return Colors[mode] as ColorPalette;
}

// Tokens semánticos para uso directo en componentes
export const SemanticColors = {
  // Backgrounds
  bg: {
    primary: '{background}',
    secondary: '{surface}',
    tertiary: '{surfaceVariant}',
    inverse: '{text}',
  },
  // Text
  text: {
    primary: '{text}',
    secondary: '{textSecondary}',
    tertiary: '{textTertiary}',
    inverse: '{textInverse}',
    onPrimary: '{onPrimary}',
    onAccent: '{onAccent}',
  },
  // Borders
  border: {
    default: '{border}',
    strong: '{borderStrong}',
    focus: '{primary}',
    error: '{error}',
  },
  // Interactive
  interactive: {
    primary: '{primary}',
    primaryHover: '{primaryDark}',
    primaryPressed: '{primaryDark}',
    secondary: '{surfaceVariant}',
    secondaryHover: '{surfaceContainerHigh}',
    accent: '{accent}',
    accentHover: '{accentDark}',
  },
  // Status
  status: {
    success: '{success}',
    warning: '{warning}',
    error: '{error}',
    available: '{statusAvailable}',
    old: '{statusOld}',
    unknown: '{statusUnknown}',
  },
} as const;