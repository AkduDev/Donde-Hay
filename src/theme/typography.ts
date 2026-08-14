/**
 * Dónde Hay - Design System Typography
 * Escalas tipográficas consistentes
 */

import { Platform } from 'react-native';

export const FontFamilies = {
  // Sistema nativo por plataforma
  sans: Platform.select({
    ios: 'system-ui',
    android: 'sans-serif',
    web: 'var(--font-sans, system-ui)',
    default: 'system-ui',
  }),
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'var(--font-mono, monospace)',
    default: 'monospace',
  }),
  // Para headings - podemos usar una fuente display personalizada después
  display: Platform.select({
    ios: 'system-ui',
    android: 'sans-serif-medium',
    web: 'var(--font-display, system-ui)',
    default: 'system-ui',
  }),
} as const;

export const FontWeights = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

export const FontSizes = {
  // Escala modular 1.25 (major third)
  xs: 10,      // 0.625rem
  sm: 12,      // 0.75rem
  base: 14,    // 0.875rem
  lg: 16,      // 1rem
  xl: 20,      // 1.25rem
  '2xl': 24,   // 1.5rem
  '3xl': 30,   // 1.875rem
  '4xl': 36,   // 2.25rem
  '5xl': 48,   // 3rem
  '6xl': 60,   // 3.75rem
} as const;

export const LineHeights = {
  none: 1,
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const LetterSpacings = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

// Variants tipográficas predefinidas
export const TypographyVariants = {
  // Display / Headlines
  displayLarge: {
    fontFamily: FontFamilies.display,
    fontSize: FontSizes['5xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
    letterSpacing: LetterSpacings.tight,
  },
  displayMedium: {
    fontFamily: FontFamilies.display,
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold,
    lineHeight: LineHeights.tight,
    letterSpacing: LetterSpacings.tight,
  },
  displaySmall: {
    fontFamily: FontFamilies.display,
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.snug,
    letterSpacing: LetterSpacings.normal,
  },

  // Headlines
  headlineLarge: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.snug,
    letterSpacing: LetterSpacings.normal,
  },
  headlineMedium: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semiBold,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },
  headlineSmall: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },

  // Titles
  titleLarge: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },
  titleMedium: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.wide,
  },
  titleSmall: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.wide,
  },

  // Body
  bodyLarge: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacings.normal,
  },
  bodyMedium: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacings.normal,
  },
  bodySmall: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },

  // Labels / UI
  labelLarge: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.wide,
  },
  labelMedium: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.wide,
  },
  labelSmall: {
    fontFamily: FontFamilies.sans,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.wider,
  },

  // Code / Mono
  codeSmall: {
    fontFamily: FontFamilies.mono,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },
  codeMedium: {
    fontFamily: FontFamilies.mono,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.normal,
    letterSpacing: LetterSpacings.normal,
  },
  codeLarge: {
    fontFamily: FontFamilies.mono,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: LineHeights.relaxed,
    letterSpacing: LetterSpacings.normal,
  },
} as const;

export type TypographyVariant = keyof typeof TypographyVariants;

// Helper para obtener variant
export function getTypographyVariant(variant: TypographyVariant) {
  return TypographyVariants[variant];
}

// Responsive typography helpers
export const ResponsiveTypography = {
  // Para web: clamp(min, preferred, max)
  clamp: (min: number, preferred: number, max: number) =>
    `clamp(${min}px, ${preferred}vw, ${max}px)`,
} as const;