/**
 * Dónde Hay - Design System Z-Index
 * Capas de apilamiento consistentes
 */

export const ZIndex = {
  // Base layers
  hide: -1,
  base: 0,

  // Layout
  behind: 10,
  below: 20,
  normal: 100,
  above: 200,

  // Navigation
  tabBar: 300,
  header: 400,
  fab: 500,

  // Overlays
  dropdown: 600,
  tooltip: 700,
  toast: 800,
  sheet: 900,
  modal: 1000,
  modalBackdrop: 950,

  // Special
  popover: 1100,
  drawer: 1200,
  loading: 1300,

  // Maximum
  max: 9999,
} as const;

export type ZIndexToken = keyof typeof ZIndex;

// Aliases semánticos para componentes
export const ZLayers = {
  // Layout
  screen: ZIndex.normal,
  header: ZIndex.header,
  tabBar: ZIndex.tabBar,
  fab: ZIndex.fab,

  // Navigation drawers/sheets
  bottomSheet: ZIndex.sheet,
  sideDrawer: ZIndex.drawer,

  // Overlays temporales
  dropdown: ZIndex.dropdown,
  autocomplete: ZIndex.dropdown,
  tooltip: ZIndex.tooltip,
  popover: ZIndex.popover,

  // Feedback
  toast: ZIndex.toast,
  snackbar: ZIndex.toast,
  loadingOverlay: ZIndex.loading,

  // Modales
  modalBackdrop: ZIndex.modalBackdrop,
  modal: ZIndex.modal,
  confirmationDialog: ZIndex.modal,
  fullScreenModal: ZIndex.modal,

  // Especial
  onboarding: ZIndex.loading + 100,
  tour: ZIndex.loading + 200,
} as const;

// Helper para obtener z-index
export function getZIndex(layer: ZIndexToken): number {
  return ZIndex[layer];
}