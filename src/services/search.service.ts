/**
 * Dónde Hay - Search Service
 * Endpoints de búsqueda
 */

import { httpClient } from '@/lib/api-client';
import type { SearchResult, SearchQuery, FilterOption } from '@/types';

// ============================================
// TYPES
// ============================================

export interface SearchParams extends Omit<SearchQuery, 'page' | 'limit'> {
  page?: number;
  limit?: number;
}

export interface Suggestion {
  text: string;
  type: 'recent' | 'trending' | 'category';
  icon?: string;
}

export interface SearchFacets {
  categories: FilterOption[];
  sources: FilterOption[];
  priceRange: { min: number; max: number; currency: string };
  locations: FilterOption[];
}

// ============================================
// SERVICE
// ============================================

export const searchService = {
  /**
   * Full-text search across products and offers
   */
  search: (params: SearchParams) =>
    httpClient.get<SearchResult>('/search', { params: params as unknown as Record<string, unknown> }),

  /**
   * Get search suggestions for autocomplete
   */
  suggestions: (query: string) =>
    httpClient.get<Suggestion[]>('/search/suggestions', {
      params: { q: query },
      skipAuth: true,
    }),

  /**
   * Get available filter facets for current search
   */
  facets: (query?: string) =>
    httpClient.get<SearchFacets>('/search/facets', {
      params: query ? { q: query } : undefined,
      skipAuth: true,
    }),

  /**
   * Get popular/trending searches
   */
  trending: (params?: { limit?: number; locationId?: string }) =>
    httpClient.get<string[]>('/search/trending', { params, skipAuth: true }),
};
