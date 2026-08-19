/**
 * Dónde Hay - Auth Store
 * Estado global de autenticación con Supabase Auth
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import type { User, UserPreferences } from '@/types';

// ============================================
// TIPOS
// ============================================

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

export interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  refreshAccessToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
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
      },

      clearAuth: () => {
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
            ? { ...state.user, preferences: { ...(state.user.preferences || {}), ...prefs } as UserPreferences }
            : null,
        })),

      refreshAccessToken: async () => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.refreshSession();

          if (error) throw error;

          if (data.session) {
            set({
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              isLoading: false,
            });
            return true;
          }

          return false;
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
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (session) {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;

            if (user) {
              set({
                user: {
                  id: user.id,
                  email: user.email || '',
                  name: user.user_metadata?.['name'] || '',
                  avatarUrl: user.user_metadata?.['avatar_url'],
                  phone: user.phone || undefined,
                  role: 'user',
                  createdAt: user.created_at,
                  updatedAt: user.updated_at || user.created_at,
                },
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                isAuthenticated: true,
                isLoading: false,
                isHydrated: true,
              });
              return;
            }
          }

          set({ isLoading: false, isHydrated: true });
        } catch {
          await supabase.auth.signOut();
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

// ============================================
// SUPABASE AUTH LISTENER
// ============================================

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState();

  if (event === 'SIGNED_IN' && session) {
    // User signed in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        store.setAuth(
          {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['name'] || '',
            avatarUrl: user.user_metadata?.['avatar_url'],
            phone: user.phone || undefined,
            role: 'user',
            createdAt: user.created_at,
            updatedAt: user.updated_at || user.created_at,
          },
          session.access_token,
          session.refresh_token
        );
      }
    });
  } else if (event === 'SIGNED_OUT') {
    store.clearAuth();
  } else if (event === 'TOKEN_REFRESHED' && session) {
    useAuthStore.setState({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });
  }
});
