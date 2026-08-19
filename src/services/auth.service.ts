/**
 * Dónde Hay - Auth Service
 * Autenticación con Supabase Auth
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

// ============================================
// TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ============================================
// SERVICE
// ============================================

export const authService = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    const user: User = {
      id: authData.user.id,
      email: authData.user.email || '',
      name: authData.user.user_metadata?.['name'] || '',
      avatarUrl: authData.user.user_metadata?.['avatar_url'] || undefined,
      phone: authData.user.phone || undefined,
      role: 'user',
      createdAt: authData.user.created_at,
      updatedAt: authData.user.updated_at || authData.user.created_at,
    };

    return {
      user,
      accessToken: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token || '',
    };
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) throw error;

    const user: User = {
      id: authData.user?.id || '',
      email: authData.user?.email || data.email,
      name: data.name,
      avatarUrl: undefined,
      phone: undefined,
      role: 'user',
      createdAt: authData.user?.created_at || new Date().toISOString(),
      updatedAt: authData.user?.updated_at || new Date().toISOString(),
    };

    return {
      user,
      accessToken: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token || '',
    };
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<User> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error('No authenticated user');

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.['name'] || '',
      avatarUrl: user.user_metadata?.['avatar_url'] || undefined,
      phone: user.phone || undefined,
      role: 'user',
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  },

  /**
   * Refresh access token
   */
  refresh: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    return {
      accessToken: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token || '',
    };
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: 'dondehay://reset-password',
    });

    if (error) throw error;

    return { message: 'Password reset email sent' };
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) throw error;

    return { message: 'Password updated successfully' };
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Change password
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) throw error;
  },

  /**
   * Verify email (Supabase handles this automatically)
   */
  verifyEmail: async (_token: string): Promise<{ message: string }> => {
    return { message: 'Email verification handled by Supabase' };
  },
};
