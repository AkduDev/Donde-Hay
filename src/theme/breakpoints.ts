/**
 * Dónde Hay - Design System Breakpoints
 * Breakpoints responsivos consistentes
 */

export const Breakpoints = {
  // Mobile first
  xs: 0,      // < 480px - Mobile pequeño
  sm: 480,    // 480px - Mobile grande
  md: 768,    // 768px - Tablet
  lg: 1024,   // 1024px - Desktop pequeño
  xl: 1280,   // 1280px - Desktop
  '2xl': 1536, // 1536px - Desktop grande
} as const;

export type Breakpoint = keyof typeof Breakpoints;

// Media query helpers
export const MediaQueries = {
  xs: `(min-width: ${Breakpoints.xs}px)`,
  sm: `(min-width: ${Breakpoints.sm}px)`,
  md: `(min-width: ${Breakpoints.md}px)`,
  lg: `(min-width: ${Breakpoints.lg}px)`,
  xl: `(min-width: ${Breakpoints.xl}px)`,
  '2xl': `(min-width: ${Breakpoints['2xl']}px)`,

  // Max-width queries
  maxXs: `(max-width: ${Breakpoints.sm - 1}px)`,
  maxSm: `(max-width: ${Breakpoints.md - 1}px)`,
  maxMd: `(max-width: ${Breakpoints.lg - 1}px)`,
  maxLg: `(max-width: ${Breakpoints.xl - 1}px)`,
  maxXl: `(max-width: ${Breakpoints['2xl'] - 1}px)`,

  // Ranges
  smOnly: `(min-width: ${Breakpoints.sm}px) and (max-width: ${Breakpoints.md - 1}px)`,
  mdOnly: `(min-width: ${Breakpoints.md}px) and (max-width: ${Breakpoints.lg - 1}px)`,
  lgOnly: `(min-width: ${Breakpoints.lg}px) and (max-width: ${Breakpoints.xl - 1}px)`,
  xlOnly: `(min-width: ${Breakpoints.xl}px) and (max-width: ${Breakpoints['2xl'] - 1}px)`,

  // Orientación
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',

  // Hover capability
  hover: '(hover: hover)',
  noHover: '(hover: none)',

  // Dark mode
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',

  // Reduced motion
  reduceMotion: '(prefers-reduced-motion: reduce)',
} as const;

// Container max-widths por breakpoint
export const ContainerMaxWidth = {
  xs: '100%',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Grid columns por breakpoint
export const GridColumns = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 12,
  xl: 12,
  '2xl': 12,
} as const;

// Gutter por breakpoint
export const GridGutter = {
  xs: 16,  // 16px
  sm: 20,  // 20px
  md: 24,  // 24px
  lg: 24,  // 24px
  xl: 32,  // 32px
  '2xl': 32, // 32px
} as const;

// Helper para obtener valor responsive
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint = 'xs'
): T | undefined {
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(currentBreakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  return undefined;
}