/**
 * Dónde Hay - useRevolicoSearch Hook
 * Combines DB products with Revolico-scraped products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scraperService, type ScrapeResult } from '@/services/scraper.service';
import { productsService } from '@/services/products.service';
import { queryKeys } from '@/lib/api-client';
import type { ProductWithOffers } from '@/types';

// ============================================
// DEDUP HELPERS
// ============================================

/** Normalize a canonical name for dedup comparison */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Compute a simple similarity ratio (0-1) between two strings */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Token overlap
  const tokensA = new Set(na.split(' '));
  const tokensB = new Set(nb.split(' '));
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/** Merge two product lists, deduplicating by name similarity */
function mergeProducts(
  dbProducts: ProductWithOffers[],
  scrapedProducts: ProductWithOffers[]
): ProductWithOffers[] {
  const merged: ProductWithOffers[] = [...dbProducts];
  const dbNames = new Set(dbProducts.map((p) => normalize(p.canonicalName)));

  for (const scraped of scrapedProducts) {
    const sn = normalize(scraped.canonicalName);

    // Check exact match
    if (dbNames.has(sn)) continue;

    // Check similarity against existing
    let isDupe = false;
    for (const existing of merged) {
      if (similarity(scraped.canonicalName, existing.canonicalName) > 0.75) {
        // Merge offers from scraped into existing
        existing.offers = [...existing.offers, ...scraped.offers];
        existing.offerCount = existing.offers.length;
        const prices = existing.offers.map((o) => o.price).filter(Boolean);
        if (prices.length > 0) {
          existing.minPrice = Math.min(...prices);
          existing.maxPrice = Math.max(...prices);
          existing.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        }
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      merged.push(scraped);
    }
  }

  return merged;
}

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

  // 3. Merge results
  const scrapedProducts = scrapeMutation.data?.stats
    ? [] // Would need to re-fetch from DB after scrape
    : [];

  const merged = mergeProducts(dbQuery.data ?? [], scrapedProducts);

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
