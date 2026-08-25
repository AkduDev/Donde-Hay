/**
 * Dónde Hay - Search Service
 * Multi-source search: Supabase DB products + Revolico scraped products
 */

import { httpClient } from '@/lib/api-client';
import { API_CONFIG } from '@/config';
import type {
  SearchResult,
  SearchQuery,
  FilterOption,
  ScrapedProduct,
  MultiSourceSearchResult,
  ProductWithOffers,
  SourceFilter,
} from '@/types';

// ============================================
// TYPES
// ============================================

export interface SearchParams extends Omit<SearchQuery, 'page' | 'limit'> {
  page?: number;
  limit?: number;
  sourceFilter?: SourceFilter;
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
// HELPERS
// ============================================

function scrapedToProductWithOffers(scraped: ScrapedProduct): ProductWithOffers {
  return {
    id: scraped.id,
    canonicalName: scraped.canonicalName,
    brand: scraped.brand ?? '',
    model: scraped.model ?? '',
    categoryId: '',
    description: scraped.description,
    imageUrls: scraped.imageUrls,
    createdAt: scraped.postedAt,
    updatedAt: scraped.postedAt,
    offers: [
      {
        id: scraped.sourceExternalId,
        productId: scraped.id,
        sellerId: '',
        sourceId: scraped.sourceId,
        price: scraped.price,
        currency: scraped.currency,
        locationId: scraped.provinceId ?? '',
        sourceUrl: scraped.sourceUrl,
        sourceExternalId: scraped.sourceExternalId,
        postedAt: scraped.postedAt,
        status: 'active' as const,
        rawData: {
          sellerName: scraped.sellerName,
          sellerPhone: scraped.sellerPhone,
          sellerWhatsapp: scraped.sellerWhatsapp,
          viewCount: scraped.viewCount,
          provinceId: scraped.provinceId,
          municipalityId: scraped.municipalityId,
        },
      },
    ],
    averagePrice: scraped.price,
    minPrice: scraped.price,
    maxPrice: scraped.price,
    offerCount: 1,
    availability: {
      available: true,
      lastSeen: scraped.postedAt,
      status: 'recent' as const,
    },
  };
}

function mergeProducts(
  dbProducts: ProductWithOffers[],
  scrapedProducts: ProductWithOffers[]
): ProductWithOffers[] {
  const merged: ProductWithOffers[] = dbProducts.map((p) => ({
    ...p,
    offers: [...p.offers],
  }));

  for (const scraped of scrapedProducts) {
    const existingIndex = merged.findIndex(
      (p) => p.canonicalName.toLowerCase() === scraped.canonicalName.toLowerCase()
    );

    if (existingIndex >= 0 && merged[existingIndex]) {
      const existing = merged[existingIndex];
      const allOffers = [...existing.offers, ...scraped.offers];
      const prices = allOffers.map((o) => o.price).filter((p) => p != null);
      const mergedProduct: ProductWithOffers = {
        id: existing.id,
        canonicalName: existing.canonicalName,
        brand: existing.brand,
        model: existing.model,
        categoryId: existing.categoryId,
        description: existing.description,
        imageUrls: existing.imageUrls,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        offers: allOffers,
        averagePrice: existing.averagePrice,
        minPrice: prices.length > 0 ? Math.min(...prices) : existing.minPrice,
        maxPrice: prices.length > 0 ? Math.max(...prices) : existing.maxPrice,
        offerCount: allOffers.length,
        availability: existing.availability,
        isFavorite: existing.isFavorite,
      };
      merged[existingIndex] = mergedProduct;
    } else {
      merged.push(scraped);
    }
  }

  return merged;
}

function buildSourceCounts(products: ProductWithOffers[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of products) {
    for (const offer of product.offers) {
      counts[offer.sourceId] = (counts[offer.sourceId] ?? 0) + 1;
    }
  }
  return counts;
}

// ============================================
// SERVICE
// ============================================

export const searchService = {
  /**
   * Full-text search across products and offers (DB only)
   */
  search: (params: SearchParams) =>
    httpClient.get<SearchResult>('/search', {
      params: params as unknown as Record<string, unknown>,
    }),

  /**
   * Search Supabase DB for products
   */
  searchDB: async (params: SearchParams): Promise<SearchResult> => {
    const result = await httpClient.get<SearchResult>('/search', {
      params: params as unknown as Record<string, unknown>,
    });
    return result;
  },

  /**
   * Search Revolico via Edge Function
   */
  searchRevolico: async (
    query: string,
    options?: { provinceId?: string; categoryId?: string; limit?: number }
  ): Promise<ScrapedProduct[]> => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/search-revolico`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, ...options }),
        }
      );

      if (!response.ok) {
        console.warn('Revolico search failed:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.products ?? []) as ScrapedProduct[];
    } catch (error) {
      console.warn('Revolico search error:', error);
      return [];
    }
  },

  /**
   * Multi-source search: combines DB products + Revolico scraped products.
   * Gracefully handles Revolico failures — returns DB results on error.
   */
  searchMultiSource: async (
    params: SearchParams
  ): Promise<MultiSourceSearchResult> => {
    const sourceFilter = params.sourceFilter ?? 'all';
    const errors: { source: string; message: string }[] = [];

    let dbProducts: ProductWithOffers[] = [];
    let dbTotal = 0;
    let scrapedRaw: ScrapedProduct[] = [];

    // 1. Search DB (always, unless sourceFilter is specifically 'revolico' only)
    if (sourceFilter !== 'revolico') {
      try {
        const dbResult = await searchService.searchDB(params);
        dbProducts = dbResult.products;
        dbTotal = dbResult.total;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'DB search failed';
        errors.push({ source: 'database', message });
      }
    }

    // 2. Search Revolico (always, unless sourceFilter is specifically 'comunidad' only)
    if (sourceFilter !== 'comunidad') {
      try {
        scrapedRaw = await searchService.searchRevolico(params.query, {
          limit: params.limit ?? 20,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Revolico search failed';
        errors.push({ source: 'revolico', message });
      }
    }

    // 3. Convert scraped products to ProductWithOffers format
    const scrapedProducts = scrapedRaw.map(scrapedToProductWithOffers);

    // 4. Merge and deduplicate
    const combinedProducts = mergeProducts(dbProducts, scrapedProducts);
    const sourceCounts = buildSourceCounts(combinedProducts);

    return {
      dbResults: {
        products: dbProducts,
        total: dbTotal,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: Math.ceil(dbTotal / (params.limit ?? 20)),
        hasNext: dbProducts.length >= (params.limit ?? 20),
        hasPrev: (params.page ?? 1) > 1,
        query: params.query ?? '',
        processingTimeMs: 0,
        sources: [],
      },
      scrapedProducts: scrapedRaw,
      combinedProducts,
      total: combinedProducts.length,
      sourceCounts,
      errors,
    };
  },

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
