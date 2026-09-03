/**
 * Dónde Hay - useRevolicoSearch Hook
 * Combines DB products with Revolico-scraped products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scraperService, type ScrapeResult } from '@/services/scraper.service';
import { productsService } from '@/services/products.service';
import { queryKeys } from '@/lib/api-client';
import { mergeByKey } from '@/lib/matching';
import type { ProductWithOffers } from '@/types';

// ============================================
// HOOKS
// ============================================

interface UseRevolicoSearchOptions {
  query?: string;
  categoryId?: string;
  enabled?: boolean;
  autoScrape?: boolean;
  limit?: number;
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
}

/**
 * Search products from both DB and Revolico
 */
export function useRevolicoSearch(options: UseRevolicoSearchOptions = {}) {
  const { query, categoryId, enabled = true, limit = 20, sortBy = 'recent' } = options;
  const queryClient = useQueryClient();

  // 1. Fetch DB products
  const dbQuery = useQuery({
    queryKey: queryKeys.search.results(query ?? '', { categoryId, limit, sortBy }),
    queryFn: async () => {
      const params: Parameters<typeof productsService.list>[0] = {
        page: 1,
        limit,
        sortBy,
      };

      if (categoryId) params.categoryId = categoryId;

      // Use search if query provided
      if (query) {
        const { searchService } = await import('@/services/search.service');
        const results = await searchService.search({
          query,
          categoryId,
          limit,
          sortBy,
          page: 1,
        });
        return results.products;
      }

      const { data } = await productsService.list(params);
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Optionally trigger Revolico scrape
  const scrapeMutation = useMutation<ScrapeResult, Error, void>({
    mutationFn: async () => {
      if (query) {
        return scraperService.searchRevolico({ query, limit: 30 });
      }
      if (categoryId) {
        return scraperService.scrapeCategory({ categoryId, limit: 50 });
      }
      throw new Error('Either query or categoryId required');
    },
    onSuccess: () => {
      // Invalidate to re-fetch from DB after scrape
      queryClient.invalidateQueries({ queryKey: queryKeys.search.results('') });
    },
  });

  // 3. Merge results using the pure matching function
  const scrapedProducts = scrapeMutation.data?.stats
    ? [] // Would need to re-fetch from DB after scrape
    : [];

  const merged = mergeByKey(dbQuery.data ?? [], scrapedProducts);

  // Sort merged results
  const sorted = [...merged].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
      case 'price-desc':
        return (b.minPrice ?? 0) - (a.minPrice ?? 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return {
    products: sorted,
    isLoading: dbQuery.isLoading,
    isError: dbQuery.isError,
    error: dbQuery.error,
    scrapeResult: scrapeMutation.data,
    isScraping: scrapeMutation.isPending,
    scrapeError: scrapeMutation.error,
    triggerScrape: scrapeMutation.mutate,
    refetch: dbQuery.refetch,
  };
}

/**
 * Trigger a one-off Revolico scrape
 */
export function useScrapeRevolico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { categoryId?: string; query?: string; limit?: number }) => {
      if (params.query) {
        return scraperService.searchRevolico({ query: params.query, limit: params.limit });
      }
      if (params.categoryId) {
        return scraperService.scrapeCategory({ categoryId: params.categoryId, limit: params.limit });
      }
      throw new Error('Either categoryId or query required');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.search.results('') });
    },
  });
}

/**
 * Get scraped Revolico products from DB
 */
export function useScrapedProducts(options: {
  categoryId?: string;
  limit?: number;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['scraper', 'revolico', options.categoryId, options.limit],
    queryFn: () =>
      scraperService.getScrapedProducts({
        categoryId: options.categoryId,
        limit: options.limit,
      }),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60 * 10,
  });
}
