/**
 * Dónde Hay - Storage Utilities
 * Wrapper tipado de SecureStore con fallback
 */

import * as SecureStore from 'expo-secure-store';

// ============================================
// INTERFACES
// ============================================

interface StorageAdapter {
  getItem: <T>(key: string) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// ============================================
// SECURE STORE ADAPTER
// ============================================

async function safeGetItem<T>(key: string): Promise<T | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function safeSetItem<T>(key: string, value: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {
    // Silently fail on web or unavailable storage
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Silently fail
  }
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  // Auth
  AUTH_ACCESS_TOKEN: 'dondehay_auth_access_token',
  AUTH_REFRESH_TOKEN: 'dondehay_auth_refresh_token',
  AUTH_USER: 'dondehay_auth_user',

  // Theme
  THEME_MODE: 'dondehay_theme_mode',

  // Search
  SEARCH_HISTORY: 'dondehay_search_history',
  RECENT_FILTERS: 'dondehay_recent_filters',

  // Location
  LAST_LOCATION: 'dondehay_last_location',
  LOCATION_PERMISSION: 'dondehay_location_permission',

  // Onboarding
  ONBOARDING_COMPLETED: 'dondehay_onboarding_completed',

  // Cache
  CATEGORIES_CACHE: 'dondehay_categories_cache',
  PROVINCES_CACHE: 'dondehay_provinces_cache',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ============================================
// GENERIC STORAGE
// ============================================

export const storage: StorageAdapter = {
  getItem: safeGetItem,
  setItem: safeSetItem,
  removeItem: safeRemoveItem,
  clear: async () => {
    // SecureStore doesn't have a clear method
    // We need to remove keys individually
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(safeRemoveItem));
  },
};

// ============================================
// CONVENIENCE METHODS
// ============================================

export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    safeGetItem<string>(STORAGE_KEYS.AUTH_ACCESS_TOKEN),
    safeGetItem<string>(STORAGE_KEYS.AUTH_REFRESH_TOKEN),
  ]);
  return { accessToken, refreshToken };
}

export async function setAuthTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await Promise.all([
    safeSetItem(STORAGE_KEYS.AUTH_ACCESS_TOKEN, accessToken),
    safeSetItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN, refreshToken),
  ]);
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    safeRemoveItem(STORAGE_KEYS.AUTH_ACCESS_TOKEN),
    safeRemoveItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN),
    safeRemoveItem(STORAGE_KEYS.AUTH_USER),
  ]);
}

export async function getSearchHistory(): Promise<string[]> {
  return (await safeGetItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY)) ?? [];
}

export async function addToSearchHistory(query: string): Promise<void> {
  const history = await getSearchHistory();
  const updated = [query, ...history.filter((h) => h !== query)].slice(0, 20);
  await safeSetItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
}

export async function removeFromSearchHistory(query: string): Promise<void> {
  const history = await getSearchHistory();
  const updated = history.filter((h) => h !== query);
  await safeSetItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
}
