/**
 * Dónde Hay - Search Service
 * Multi-source search: Supabase DB products + Revolico scraped products
 */

import { httpClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { applyAggregate } from '@/lib/matching';
import type {
  SearchResult,
  SearchQuery,
  FilterOption,
  MultiSourceSearchResult,
  ProductWithOffers,
  ProductOffer,
  SourceFilter,
  SourceSummary,
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
// RPC search_products RESULT TYPES
// ============================================

/**
 * Oferta tal y como la devuelve el RPC `search_products` dentro del array JSONB
 * `offers` (camelCase, ya serializado en SQL).
 */
interface RpcOffer {
  id: string;
  productId: string;
  sellerId?: string | null;
  sourceId: string;
  price: number | null;
  currency: string;
  locationId?: string | null;
  sourceUrl?: string | null;
  sourceExternalId?: string | null;
  postedAt: string;
  status: string;
  sellerName?: string | null;
  rawData?: Record<string, unknown> | null;
}

/**
 * Fila del RETURNS TABLE del RPC `search_products`: producto snake_case +
 * `offers` JSONB (array camelCase) + agregados calculados en el servidor.
 */
interface SearchProductRow {
  id: string;
  canonical_name: string;
  brand?: string | null;
  model?: string | null;
  description?: string | null;
  image_urls?: string[] | null;
  category_id?: string | null;
  specifications?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  offers: RpcOffer[] | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  average_price?: number | string | null;
  offer_count?: number | string | null;
  source_count?: number | string | null;
}

// ============================================
// RPC ROW NORMALIZERS (RPC result → camelCase domain)
// ============================================

function mapRpcOffer(offer: RpcOffer): ProductOffer {
  return {
    id: offer.id,
    productId: offer.productId,
    sellerId: offer.sellerId ?? '',
    sourceId: offer.sourceId,
    price: offer.price == null ? NaN : Number(offer.price),
    currency: offer.currency as ProductOffer['currency'],
    locationId: offer.locationId ?? '',
    sourceUrl: offer.sourceUrl ?? '',
    sourceExternalId: offer.sourceExternalId ?? undefined,
    postedAt: offer.postedAt,
    status: (offer.status ?? 'active') as ProductOffer['status'],
    rawData: offer.rawData ?? undefined,
  };
}

function toNumber(value?: number | string | null): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapSearchProductRow(row: SearchProductRow): ProductWithOffers {
  const offers = (row.offers ?? []).map((o) => mapRpcOffer(o));
  const product: ProductWithOffers = {
    id: row.id,
    canonicalName: row.canonical_name,
    brand: row.brand ?? '',
    model: row.model ?? '',
    categoryId: row.category_id ?? '',
    description: row.description ?? undefined,
    specifications: row.specifications ?? undefined,
    imageUrls: row.image_urls ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    offers,
    offerCount: Number(row.offer_count ?? offers.length),
    availability: {
      available: offers.some((o) => o.status === 'active'),
      lastSeen: row.created_at,
      status: 'unknown',
    },
  };
  // Se conservan los agregados calculados en el servidor (min/max/avg) y se
  // recalculan min/avg/max/offerCount/availability con la librería pura de
  // matching (los precios pueden traer valores null de ofertas sin precio).
  product.minPrice = toNumber(row.min_price);
  product.maxPrice = toNumber(row.max_price);
  product.averagePrice = toNumber(row.average_price);
  return applyAggregate(product);
}

// ============================================
// SERVICE
// ============================================

export const searchService = {
  /**
   * Full-text search across products and offers (DB only)
   */
  search: (params: SearchParams) => searchService.searchDB(params),

  /**
   * Search Supabase DB for products via the `search_products` RPC.
   * The RPC runs server-side: ILIKE full-text + filters + aggregation
   * (min/max/avg price, offer_count, source_count) and cursor-based paging.
   */
  searchDB: async (params: SearchParams): Promise<SearchResult> => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const term = (params.query ?? '').trim().replace(/%/g, '').replace(/,/g, ' ').slice(0, 120);

    const { data, error } = await supabase.rpc('search_products', {
      search_query: term,
      p_category_id: params.categoryId ?? null,
      p_location_id: params.locationId ?? null,
      p_source_ids: params.sourceIds && params.sourceIds.length > 0 ? params.sourceIds : null,
      p_min_price: params.minPrice ?? null,
      p_max_price: params.maxPrice ?? null,
      p_sort_by: (params.sortBy === 'distance' ? 'recent' : params.sortBy) ?? 'recent',
      p_cursor: null,
      p_limit: limit,
    });

    if (error) throw error;

    const products = ((data ?? []) as unknown as SearchProductRow[]).map(
      mapSearchProductRow
    );
    const total = products.length;
    const counts = buildSourceCounts(products);
    const sources: SourceSummary[] = Object.entries(counts).map(
      ([sourceId, count]) => ({ sourceId, count })
    );

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      // El RPC es cursor-based (sin offset): la marca "hay más" se infiere de
      // haber traído una página completa.
      hasNext: products.length >= limit,
      hasPrev: page > 1,
      query: term,
      processingTimeMs: 0,
      sources,
    };
  },

  /**
   * Multi-source search: searches DB products (which include data from
   * all scraped sources). The scraper (scraperService) runs separately
   * and populates the DB; search just reads from it.
   */
  searchMultiSource: async (
    params: SearchParams
  ): Promise<MultiSourceSearchResult> => {
    const errors: { source: string; message: string }[] = [];
    let dbProducts: ProductWithOffers[] = [];
    let dbTotal = 0;

    try {
      const dbResult = await searchService.searchDB(params);
      dbProducts = dbResult.products;
      dbTotal = dbResult.total;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DB search failed';
      errors.push({ source: 'database', message });
    }
    const sourceCounts = buildSourceCounts(dbProducts);

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
      scrapedProducts: [],
      combinedProducts: dbProducts,
      total: dbProducts.length,
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
