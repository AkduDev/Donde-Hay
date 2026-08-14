/**
 * Dónde Hay - Auth Store
 * Estado global de autenticación con Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { httpClient, getStoredTokens, storeTokens, clearTokens, AUTH_STORAGE_KEYS } from '@/lib/api-client';

// ============================================
// TIPOS
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  role: 'user' | 'seller' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: 'USD' | 'CUP' | 'MLC';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    alerts: boolean;
    promotions: boolean;
  };
  searchRadius: number; // km
  defaultLocation?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

export interface AuthActions {
  // Core auth
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // Token management
  refreshAccessToken: () => Promise<boolean>;
  getAccessToken: () => string | null;

  // Hydration
  hydrate: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// ============================================
// STORAGE ADAPTER PARA SECURESTORE
// ============================================

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value;
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        // Update httpClient token getter
        storeTokens(accessToken, refreshToken);
      },

      clearAuth: async () => {
        await clearTokens();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      updatePreferences: (prefs) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, preferences: { ...state.user.preferences, ...prefs } }
            : null,
        })),

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          set({ isLoading: true });
          const response = await httpClient.post<{ accessToken: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken },
            { skipAuth: true }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response;
          await storeTokens(newAccessToken, newRefreshToken);

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            isLoading: false,
          });
          return true;
        } catch {
          get().clearAuth();
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      getAccessToken: () => get().accessToken,

      hydrate: async () => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = await getStoredTokens();
          if (accessToken && refreshToken) {
            // Verificar token con el backend
            const user = await httpClient.get<User>('/auth/me');
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              isHydrated: true,
            });
          } else {
            set({ isLoading: false, isHydrated: true });
          }
        } catch {
          // Token inválido o expirado
          await clearTokens();
          set({ isLoading: false, isHydrated: true });
        }
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'donde-hay-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectIsHydrated = (state: AuthStore) => state.isHydrated;
export const selectAccessToken = (state: AuthStore) => state.accessToken;
export const selectRefreshToken = (state: AuthStore) => state.refreshToken;