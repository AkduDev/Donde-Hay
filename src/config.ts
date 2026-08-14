/**
 * Dónde Hay - Environment Configuration
 * Reads EXPO_PUBLIC_* environment variables
 */

import Constants from 'expo-constants';

// Helper to safely get env vars with fallback
function getEnvVar(key: string, fallback: string = ''): string {
  const value = Constants.expoConfig?.extra?.[key] 
    ?? process.env[key] 
    ?? fallback;
  return value;
}

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  baseUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:3000/api'),
  wsUrl: getEnvVar('EXPO_PUBLIC_WS_BASE_URL', 'ws://localhost:3000'),
  timeout: 15000,
} as const;

// ============================================
// APP INFO
// ============================================

export const APP_CONFIG = {
  version: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
  name: getEnvVar('EXPO_PUBLIC_APP_NAME', 'Dónde Hay'),
  isDev: __DEV__,
  isProduction: !__DEV__,
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  analytics: getEnvVar('EXPO_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  notifications: getEnvVar('EXPO_PUBLIC_ENABLE_NOTIFICATIONS', 'false') === 'true',
} as const;

// ============================================
// SOURCES (Cuban marketplaces)
// ============================================

export const SOURCES = {
  revolico: {
    id: 'revolico',
    name: 'Revolico',
    type: 'marketplace' as const,
    baseUrl: 'https://revolico.com',
  },
  '1cuba': {
    id: '1cuba',
    name: '1Cuba',
    type: 'marketplace' as const,
    baseUrl: 'https://1cuba.cu',
  },
  choleslibres: {
    id: 'choleslibres',
    name: 'CholesLibres',
    type: 'marketplace' as const,
    baseUrl: 'https://choleslibres.com',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    type: 'social' as const,
    baseUrl: 'https://facebook.com/marketplace',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    type: 'social' as const,
    baseUrl: 'https://instagram.com',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    type: 'social' as const,
    baseUrl: 'https://t.me',
  },
  comunidad: {
    id: 'comunidad',
    name: 'Comunidad Dónde Hay',
    type: 'community' as const,
    baseUrl: 'https://dondehay.app',
  },
} as const;

export type SourceId = keyof typeof SOURCES;
