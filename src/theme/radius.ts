/**
 * Dónde Hay - Design System Border Radius
 */

export const Radius = {
  none: 0,
  xs: 4,    // 0.25rem - pequeños (badges, chips)
  sm: 6,    // 0.375rem - inputs, botones pequeños
  md: 8,    // 0.5rem - botones, cards pequeñas
  lg: 12,   // 0.75rem - cards, modales, sheets
  xl: 16,   // 1rem - cards grandes, contenedores principales
  '2xl': 24, // 1.5rem - hero sections, modales grandes
  full: 9999, // Píldoras, avatars circulares
} as const;

export type RadiusToken = keyof typeof Radius;

// Aliases semánticos
export const BorderRadius = {
  // Base tokens (re-exported para conveniencia)
  none: Radius.none,
  xs: Radius.xs,
  sm: Radius.sm,
  md: Radius.md,
  lg: Radius.lg,
  xl: Radius.xl,
  '2xl': Radius['2xl'],
  full: Radius.full,

  // Componentes
  button: Radius.sm,
  buttonLarge: Radius.md,
  input: Radius.sm,
  card: Radius.lg,
  cardLarge: Radius.xl,
  badge: Radius.full,
  chip: Radius.full,
  avatar: Radius.full,
  modal: Radius.xl,
  sheet: Radius['2xl'],
  tooltip: Radius.md,

  // Layout
  container: Radius.lg,
  section: Radius.xl,

  // Imágenes
  image: Radius.md,
  imageLarge: Radius.lg,
  thumbnail: Radius.sm,
} as const;