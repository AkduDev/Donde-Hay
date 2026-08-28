/**
 * Dónde Hay - Theme Store
 * Estado global del tema con Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

// ============================================
// TIPOS
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  isLoading: boolean;
}

export interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  initialize: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

// ============================================
// STORAGE ADAPTER
// ============================================

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Silently fail on web
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Silently fail on web
    }
  },
};

// ============================================
// STORE
// ============================================

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      mode: 'system',
      resolvedMode: 'light',
      isLoading: true,

      // Actions
      setMode: (mode) => {
        const systemScheme = Appearance.getColorScheme();
        const resolved: 'light' | 'dark' = mode === 'system' ? (systemScheme as 'light' | 'dark' ?? 'light') : mode;
        set({ mode, resolvedMode: resolved });
      },

      toggleMode: () => {
        const { mode } = get();
        const modes: ThemeMode[] = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(mode);
        const nextMode = modes[(currentIndex + 1) % modes.length] as ThemeMode;
        get().setMode(nextMode);
      },

      initialize: () => {
        const systemScheme = Appearance.getColorScheme();
        const { mode } = get();
        const resolved: 'light' | 'dark' = mode === 'system' ? (systemScheme as 'light' | 'dark' ?? 'light') : mode;
        set({ resolvedMode: resolved, isLoading: false });
      },
    }),
    {
      name: 'donde-hay-theme',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        mode: state.mode,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectThemeMode = (state: ThemeStore) => state.mode;
export const selectResolvedThemeMode = (state: ThemeStore) => state.resolvedMode;
export const selectThemeLoading = (state: ThemeStore) => state.isLoading;