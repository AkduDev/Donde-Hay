/**
 * Dónde Hay - Profile Service
 * Endpoints de perfil de usuario
 */

import { httpClient } from '@/lib/api-client';
import type { User, UserPreferences, SearchHistoryItem, PaginatedResponse } from '@/types';

// ============================================
// TYPES
// ============================================

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesRequest {
  currency?: 'USD' | 'CUP' | 'MLC';
  theme?: 'light' | 'dark' | 'system';
  notifications?: Partial<UserPreferences['notifications']>;
  searchRadius?: number;
  defaultLocation?: string;
  favoriteCategories?: string[];
}

export interface UserStats {
  favoritesCount: number;
  alertsCount: number;
  searchesCount: number;
  savedSearchesCount: number;
}

// ============================================
// SERVICE
// ============================================

export const profileService = {
  /**
   * Get current user profile
   */
  me: () =>
    httpClient.get<User>('/profile/me'),

  /**
   * Update profile
   */
  update: (data: UpdateProfileRequest) =>
    httpClient.patch<User>('/profile/me', data),

  /**
   * Update preferences
   */
  updatePreferences: (data: UpdatePreferencesRequest) =>
    httpClient.patch<UserPreferences>('/profile/preferences', data),

  /**
   * Get user stats
   */
  stats: () =>
    httpClient.get<UserStats>('/profile/stats'),

  /**
   * Get search history
   */
  history: (params?: { page?: number; limit?: number }) =>
    httpClient.get<PaginatedResponse<SearchHistoryItem>>('/profile/history', { params }),

  /**
   * Clear search history
   */
  clearHistory: () =>
    httpClient.delete('/profile/history'),

  /**
   * Delete specific history item
   */
  deleteHistoryItem: (id: string) =>
    httpClient.delete(`/profile/history/${id}`),

  /**
   * Upload avatar
   */
  uploadAvatar: (formData: FormData) =>
    httpClient.post<{ avatarUrl: string }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Delete account
   */
  deleteAccount: () =>
    httpClient.delete('/profile/me'),
};
