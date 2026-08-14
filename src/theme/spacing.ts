/**
 * Dónde Hay - Design System Spacing
 * Sistema de espaciado basado en 4px (base unit)
 */

export const Space = {
  // Base unit: 4px
  0: 0,
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  7: 28,   // 1.75rem
  8: 32,   // 2rem
  9: 36,   // 2.25rem
  10: 40,  // 2.5rem
  11: 44,  // 2.75rem
  12: 48,  // 3rem
  14: 56,  // 3.5rem
  16: 64,  // 4rem
  20: 80,  // 5rem
  24: 96,  // 6rem
  28: 112, // 7rem
  32: 128, // 8rem
  36: 144, // 9rem
  40: 160, // 10rem
  44: 176, // 11rem
  48: 192, // 12rem
  52: 208, // 13rem
  56: 224, // 14rem
  60: 240, // 15rem
  64: 256, // 16rem
  72: 288, // 18rem
  80: 320, // 20rem
  96: 384, // 24rem
} as const;

export type SpaceToken = keyof typeof Space;

// Aliases semánticos para uso común
export const Spacing = {
  // Micro spacing
  none: Space[0],
  xxxs: Space[1],   // 4px
  xxs: Space[2],    // 8px
  xs: Space[3],     // 12px

  // Base spacing
  sm: Space[4],     // 16px
  md: Space[5],     // 20px
  lg: Space[6],     // 24px
  xl: Space[8],     // 32px
  '2xl': Space[10], // 40px
  '3xl': Space[12], // 48px
  '4xl': Space[16], // 64px

  // Component specific
  // Input padding
  inputPaddingX: Space[4],   // 16px
  inputPaddingY: Space[3],   // 12px
  inputGap: Space[2],        // 8px

  // Button padding
  buttonPaddingX: Space[5],  // 20px
  buttonPaddingY: Space[3],  // 12px
  buttonGap: Space[2],       // 8px

  // Card padding
  cardPadding: Space[4],     // 16px
  cardGap: Space[3],         // 12px

  // Screen padding
  screenPaddingX: Space[4],  // 16px
  screenPaddingY: Space[5],  // 20px

  // Navigation
  tabBarHeight: 56 + (Platform.OS === 'ios' ? 20 : 0), // Aproximado, se ajusta con safe area
  headerHeight: 56,

  // Border radius (referencia, ver radius.ts)
  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
} as const;

import { Platform } from 'react-native';

// Helpers para crear valores de spacing consistentes
export const spacing = {
  // Margin / Padding helpers
  m: (value: SpaceToken) => Space[value],
  mx: (value: SpaceToken) => Space[value],
  my: (value: SpaceToken) => Space[value],
  mt: (value: SpaceToken) => Space[value],
  mr: (value: SpaceToken) => Space[value],
  mb: (value: SpaceToken) => Space[value],
  ml: (value: SpaceToken) => Space[value],
  p: (value: SpaceToken) => Space[value],
  px: (value: SpaceToken) => Space[value],
  py: (value: SpaceToken) => Space[value],
  pt: (value: SpaceToken) => Space[value],
  pr: (value: SpaceToken) => Space[value],
  pb: (value: SpaceToken) => Space[value],
  pl: (value: SpaceToken) => Space[value],

  // Gap helpers
  gap: (value: SpaceToken) => Space[value],
  rowGap: (value: SpaceToken) => Space[value],
  columnGap: (value: SpaceToken) => Space[value],
} as const;

// Responsive spacing para web (usando CSS clamp)
export const responsiveSpacing = {
  // Container max widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  // Gutters responsive
  gutter: {
    mobile: Space[4],   // 16px
    tablet: Space[6],   // 24px
    desktop: Space[8],  // 32px
  },
} as const;