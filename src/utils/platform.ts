/**
 * Dónde Hay - Platform Utilities
 * Helpers de plataforma y dispositivo
 */

import { Platform, Dimensions } from 'react-native';

// ============================================
// PLATAFORMA
// ============================================

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// ============================================
// DIMENSIONES
// ============================================

const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

export const dimensions = {
  window: {
    width: window.width,
    height: window.height,
  },
  screen: {
    width: screen.width,
    height: screen.height,
  },
  isSmall: window.width < 375,
  isMedium: window.width >= 375 && window.width < 768,
  isLarge: window.width >= 768,
  isTablet: window.width >= 768,
};

// ============================================
// SAFE AREA
// ============================================

export const SAFE_AREA_OFFSETS = {
  ios: {
    top: 47,
    bottom: 34,
  },
  android: {
    top: 0,
    bottom: 0,
  },
} as const;

export function getSafeAreaInsets() {
  return SAFE_AREA_OFFSETS[Platform.OS as 'ios' | 'android'] ?? SAFE_AREA_OFFSETS.android;
}

// ============================================
// STATUS BAR
// ============================================

export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 0;

// ============================================
// INPUT HEIGHTS
// ============================================

export const INPUT_HEIGHTS = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

// ============================================
// TAB BAR
// ============================================

export const TAB_BAR_HEIGHT = 60;

// ============================================
// ANIMATION
// ============================================

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// ============================================
// NETWORK
// ============================================

export function getNetworkInfo() {
  return {
    isOffline: false, // Will be implemented with @react-native-community/netinfo
    type: 'unknown',
  };
}
