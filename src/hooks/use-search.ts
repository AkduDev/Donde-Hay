/**
 * Dónde Hay - useSearch Hook
 * Multi-source search: DB products + Revolico scraped products
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { queryKeys } from '@/lib/api-client';
import type { SearchParams } from '@/services/search.service';
import type { SourceFilter } from '@/types';

// ============================================
// QUERIES
// ============================================

/**
 * Multi-source search (DB + Revolico).
 * Falls back to DB-only results if Revolico fails.
 */
export function useMultiSourceSearch(
  params: SearchParams,
  sourceFilter: SourceFilter = 'all'
) {
  return useQuery({
    queryKey: queryKeys.search.multiSource(params.query, sourceFilter, params),
    queryFn: () =>
      searchService.searchMultiSource({ ...params, sourceFilter }),
    enabled: !!params.query && params.query.length >= 2,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

/**
 * Full-text search (DB only, legacy)
 */
export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: queryKeys.search.results(params.query, params),
    queryFn: () => searchService.search(params),
    enabled: !!params.query && params.query.length >= 2,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Infinite scroll search results (DB only)
 */
export function useInfiniteSearch(query: string, filters?: Omit<SearchParams, 'query' | 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.search.results(query, filters),
    queryFn: ({ pageParam = 1 }) =>
      searchService.search({ query, ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!query && query.length >= 2,
  });
}

/**
 * Search suggestions (autocomplete)
 */
export function useSuggestions(query: string) {
  return useQuery({
    queryKey: queryKeys.search.suggestions(query),
    queryFn: () => searchService.suggestions(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Search facets for filters
 */
export function useSearchFacets(query?: string) {
  return useQuery({
    queryKey: queryKeys.search.facets(query),
    queryFn: () => searchService.facets(query),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Trending searches
 */
export function useTrendingSearches(limit?: number) {
  return useQuery({
    queryKey: queryKeys.products.trending(),
    queryFn: () => searchService.trending({ limit }),
    staleTime: 1000 * 60 * 30,
  });
}
