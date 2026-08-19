/**
 * Dónde Hay - useFavorites Hook
 * Hooks de favoritos/guardados con TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '@/services/favorites.service';
import { queryKeys } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';

// ============================================
// QUERIES
// ============================================

/**
 * Get user's favorites
 */
export function useFavorites(type?: 'product' | 'search' | 'seller') {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.favorites.list(type),
    queryFn: () => favoritesService.list(type),
    enabled: isAuthenticated,
  });
}

/**
 * Get favorite products
 */
export function useFavoriteProducts() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.favorites.list('products'),
    queryFn: () => favoritesService.products(),
    enabled: isAuthenticated,
  });
}

/**
 * Get favorite sellers
 */
export function useFavoriteSellers() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.favorites.list('sellers'),
    queryFn: () => favoritesService.sellers(),
    enabled: isAuthenticated,
  });
}

/**
 * Get saved searches
 */
export function useSavedSearches() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.favorites.list('searches'),
    queryFn: () => favoritesService.searches(),
    enabled: isAuthenticated,
  });
}

/**
 * Check if item is favorited
 */
export function useIsFavorite(type: string, targetId: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['favorites', 'check', type, targetId],
    queryFn: () => favoritesService.check(type, targetId),
    enabled: isAuthenticated && !!type && !!targetId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Add to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: 'product' | 'search' | 'seller'; targetId: string }) =>
      favoritesService.add(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() });
      queryClient.setQueryData(
        ['favorites', 'check', variables.type, variables.targetId],
        { isFavorite: true }
      );
    },
  });
}

/**
 * Remove from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => favoritesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() });
    },
  });
}

/**
 * Toggle favorite (add if not favorited, remove if favorited)
 */
export function useToggleFavorite(type: string, targetId: string) {
  const queryClient = useQueryClient();
  const { data: isFavorite } = useIsFavorite(type, targetId);

  return useMutation({
    mutationFn: async () => {
      if (isFavorite?.isFavorite) {
        return favoritesService.remove(targetId);
      }
      return favoritesService.add({ type: type as 'product' | 'search' | 'seller', targetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() });
      queryClient.invalidateQueries({ queryKey: ['favorites', 'check', type, targetId] });
    },
  });
}

// ============================================
// SEARCH FAVORITES
// ============================================

/**
 * Save a search
 */
export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { query: string; name?: string; notifyEnabled?: boolean }) =>
      favoritesService.saveSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list('searches') });
    },
  });
}

/**
 * Delete saved search
 */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => favoritesService.deleteSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list('searches') });
    },
  });
}

/**
 * Toggle search notification
 */
export function useToggleSearchNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      favoritesService.toggleSearchNotification(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list('searches') });
    },
  });
}
