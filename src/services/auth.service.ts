/**
 * Dónde Hay - Auth Service
 * Endpoints de autenticación
 */

import { httpClient } from '@/lib/api-client';
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
  login: (data: LoginRequest) =>
    httpClient.post<AuthResponse>('/auth/login', data, { skipAuth: true }),

  /**
   * Register new user
   */
  register: (data: RegisterRequest) =>
    httpClient.post<AuthResponse>('/auth/register', data, { skipAuth: true }),

  /**
   * Get current user profile
   */
  me: () => httpClient.get<User>('/auth/me'),

  /**
   * Refresh access token
   */
  refresh: (refreshToken: string) =>
    httpClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    ),

  /**
   * Request password reset email
   */
  forgotPassword: (data: ForgotPasswordRequest) =>
    httpClient.post<{ message: string }>('/auth/forgot-password', data, { skipAuth: true }),

  /**
   * Reset password with token
   */
  resetPassword: (data: ResetPasswordRequest) =>
    httpClient.post<{ message: string }>('/auth/reset-password', data, { skipAuth: true }),

  /**
   * Logout (invalidate tokens)
   */
  logout: () => httpClient.post('/auth/logout'),

  /**
   * Change password
   */
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    httpClient.post('/auth/change-password', data),

  /**
   * Verify email
   */
  verifyEmail: (token: string) =>
    httpClient.post<{ message: string }>(`/auth/verify-email/${token}`, undefined, { skipAuth: true }),
};
