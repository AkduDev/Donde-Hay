/**
 * Dónde Hay - Favorites Service
 * Endpoints de favoritos/guardados
 */

import { httpClient } from '@/lib/api-client';
import type { Favorite, ProductWithOffers, Seller, SavedSearch } from '@/types';

// ============================================
// SERVICE
// ============================================

export const favoritesService = {
  /**
   * Get user's favorites
   */
  list: (type?: 'product' | 'search' | 'seller') =>
    httpClient.get<Favorite[]>('/favorites', { params: type ? { type } : undefined }),

  /**
   * Add item to favorites
   */
  add: (data: { type: 'product' | 'search' | 'seller'; targetId: string }) =>
    httpClient.post<Favorite>('/favorites', data),

  /**
   * Remove item from favorites
   */
  remove: (id: string) =>
    httpClient.delete(`/favorites/${id}`),

  /**
   * Check if item is favorited
   */
  check: (type: string, targetId: string) =>
    httpClient.get<{ isFavorite: boolean }>('/favorites/check', {
      params: { type, targetId },
    }),

  /**
   * Get favorite products with details
   */
  products: () =>
    httpClient.get<ProductWithOffers[]>('/favorites/products'),

  /**
   * Get favorite sellers with details
   */
  sellers: () =>
    httpClient.get<Seller[]>('/favorites/sellers'),

  /**
   * Get saved searches
   */
  searches: () =>
    httpClient.get<SavedSearch[]>('/favorites/searches'),

  /**
   * Save a search
   */
  saveSearch: (data: { query: string; name?: string; notifyEnabled?: boolean }) =>
    httpClient.post<SavedSearch>('/favorites/searches', data),

  /**
   * Delete saved search
   */
  deleteSearch: (id: string) =>
    httpClient.delete(`/favorites/searches/${id}`),

  /**
   * Toggle save search notification
   */
  toggleSearchNotification: (id: string, enabled: boolean) =>
    httpClient.patch<SavedSearch>(`/favorites/searches/${id}`, { notifyEnabled: enabled }),
};
