/**
 * Dónde Hay - Search Service
 * Multi-source search: Supabase DB products + Revolico scraped products
 */

import { Platform } from 'react-native';
import { httpClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { API_CONFIG } from '@/config';
import { mergeByKey, applyAggregate } from '@/lib/matching';
import type {
  SearchResult,
  SearchQuery,
  FilterOption,
  ScrapedProduct,
  MultiSourceSearchResult,
  ProductWithOffers,
  ProductOffer,
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
  const base: ProductWithOffers = {
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
    offerCount: 1,
    availability: { available: true, lastSeen: scraped.postedAt, status: 'recent' as const },
  };
  return applyAggregate(base);
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
// SUPABASE ROW NORMALIZERS (snake_case → camelCase)
// ============================================

interface OfferRow {
  id: string;
  product_id: string;
  seller_id?: string | null;
  source_id: string;
  price: number | string;
  currency: string;
  location_id?: string | null;
  source_url?: string | null;
  source_external_id?: string | null;
  posted_at: string;
  status: string;
  raw_data?: Record<string, unknown> | null;
}

interface ProductRow {
  id: string;
  canonical_name: string;
  brand?: string | null;
  model?: string | null;
  category_id?: string | null;
  description?: string | null;
  specifications?: Record<string, string> | null;
  image_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  offers?: OfferRow[] | null;
}

function mapOfferRow(offer: OfferRow): ProductOffer {
  return {
    id: offer.id,
    productId: offer.product_id,
    sellerId: offer.seller_id ?? '',
    sourceId: offer.source_id,
    price: Number(offer.price),
    currency: offer.currency as ProductOffer['currency'],
    locationId: offer.location_id ?? '',
    sourceUrl: offer.source_url ?? '',
    sourceExternalId: offer.source_external_id ?? undefined,
    postedAt: offer.posted_at,
    status: offer.status as ProductOffer['status'],
    rawData: offer.raw_data ?? undefined,
  };
}

function mapProductRow(row: ProductRow): ProductWithOffers {
  const offers = (row.offers ?? []).map((o) => mapOfferRow(o));
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
    offerCount: offers.length,
    availability: {
      available: offers.some((o) => o.status === 'active'),
      lastSeen: row.created_at,
      status: 'unknown',
    },
  };
  // La agregación (min/avg/max/offerCount/availability/lastSeen) la calcula la
  // librería pura de matching, no el servicio (frontera snake->camel only).
  return applyAggregate(product);
}

const hasLocalBackend =
  API_CONFIG.baseUrl.includes('localhost') || API_CONFIG.baseUrl.includes('127.0.0.1');

// ============================================
// SERVICE
// ============================================

export const searchService = {
  /**
   * Full-text search across products and offers (DB only)
   */
  search: (params: SearchParams) => searchService.searchDB(params),

  /**
   * Search Supabase DB for products
   */
  searchDB: async (params: SearchParams): Promise<SearchResult> => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const term = (params.query ?? '').trim().replace(/%/g, '').replace(/,/g, ' ').slice(0, 120);

    let query = supabase
      .from('products')
      .select('*, offers:product_offers(*, seller:sellers(*))', {
        count: 'exact',
      });

    if (term) {
      query = query.or(
        [
          `canonical_name.ilike.%${term}%`,
          `brand.ilike.%${term}%`,
          `model.ilike.%${term}%`,
          `description.ilike.%${term}%`,
        ].join(',')
      );
    }
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }
    if (params.locationId) {
      query = query.eq('product_offers.location_id', params.locationId);
    }
    if (params.minPrice) {
      query = query.gte('product_offers.price', params.minPrice);
    }
    if (params.maxPrice) {
      query = query.lte('product_offers.price', params.maxPrice);
    }
    if (params.sourceIds && params.sourceIds.length > 0) {
      query = query.in('product_offers.source_id', params.sourceIds);
    }

    switch (params.sortBy) {
      case 'price-asc':
        query = query.order('product_offers(price)', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('product_offers(price)', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const products = (data ?? []).map(mapProductRow);
    const total = count ?? 0;

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: from + products.length < total,
      hasPrev: page > 1,
      query: term,
      processingTimeMs: 0,
      sources: [],
    };
  },

  /**
   * Search Revolico via Edge Function
   */
  searchRevolico: async (
    query: string,
    options?: { provinceId?: string; categoryId?: string; limit?: number }
  ): Promise<ScrapedProduct[]> => {
    // Sin backend scraping configurado en el device (apunta a localhost del PC),
    // devolvemos [] sin disparar un fetch que fallaría con ConnectException.
    if (hasLocalBackend && Platform.OS !== 'web') {
      return [];
    }
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

    // 4. Merge and deduplicate (librería pura de matching)
    const combinedProducts = mergeByKey(dbProducts, scrapedProducts);
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
