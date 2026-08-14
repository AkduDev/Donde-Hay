/**
 * Dónde Hay - useProfile Hook
 * Hooks de perfil con TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/authStore';
import type { UpdateProfileRequest, UpdatePreferencesRequest } from '@/services/profile.service';

// ============================================
// QUERIES
// ============================================

/**
 * Get user profile
 */
export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.me(),
    enabled: isAuthenticated,
  });
}

/**
 * Get user stats
 */
export function useProfileStats() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: () => profileService.stats(),
    enabled: isAuthenticated,
  });
}

/**
 * Get search history
 */
export function useSearchHistory(page?: number, limit?: number) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile', 'history', page, limit],
    queryFn: () => profileService.history({ page, limit }),
    enabled: isAuthenticated,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileService.update(data),
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['profile', 'me'], user);
    },
  });
}

/**
 * Update preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) => profileService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

/**
 * Clear search history
 */
export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileService.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'history'] });
    },
  });
}

/**
 * Delete history item
 */
export function useDeleteHistoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profileService.deleteHistoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'history'] });
    },
  });
}

/**
 * Upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (formData: FormData) => profileService.uploadAvatar(formData),
    onSuccess: ({ avatarUrl }) => {
      updateUser({ avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      clearAuth();
    },
  });
}
