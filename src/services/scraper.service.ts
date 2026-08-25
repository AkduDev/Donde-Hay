/**
 * Dónde Hay - Scraper Service
 * Client-side service for calling the scrape-revolico Edge Function
 */

import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import type { ProductWithOffers } from '@/types';

// ============================================
// TYPES
// ============================================

export interface ScrapeCategoryParams {
  categoryId: string;
  limit?: number;
}

export interface ScrapeSearchParams {
  query: string;
  limit?: number;
}

export interface ScrapeResult {
  message: string;
  stats: {
    products: number;
    offers: number;
    sellers: number;
  };
  adsCount: number;
  categoriesScraped: string[];
  hasMore: boolean;
  nextCursor: string | null;
  durationMs: number;
}

export interface ScrapedProductsParams {
  categoryId?: string;
  sourceId?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// HELPERS
// ============================================

function getSupabaseUrl(): string {
  return (
    Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_URL'] ??
    process.env['EXPO_PUBLIC_SUPABASE_URL'] ??
    ''
  );
}

function getSupabaseAnonKey(): string {
  return (
    Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ??
    process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ??
    ''
  );
}

async function callEdgeFunction(body: Record<string, unknown>): Promise<ScrapeResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${getSupabaseUrl()}/functions/v1/scrape-revolico`;
  const anonKey = getSupabaseAnonKey();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Edge function failed with status ${res.status}`);
  }

  return res.json() as Promise<ScrapeResult>;
}

// ============================================
// SERVICE
// ============================================

export const scraperService = {
  /**
   * Trigger a Revolico scrape for a specific category
   */
  scrapeCategory: async (params: ScrapeCategoryParams): Promise<ScrapeResult> => {
    return callEdgeFunction({
      categoryId: params.categoryId,
      limit: params.limit ?? 50,
    });
  },

  /**
   * Trigger a Revolico scrape by search term (maps to categories)
   */
  searchRevolico: async (params: ScrapeSearchParams): Promise<ScrapeResult> => {
    return callEdgeFunction({
      search: params.query,
      limit: params.limit ?? 30,
    });
  },

  /**
   * Get scraped products from our DB (products that were scraped from Revolico)
   */
  getScrapedProducts: async (params?: ScrapedProductsParams): Promise<ProductWithOffers[]> => {
    let query = supabase
      .from('products')
      .select(`
        *,
        offers:product_offers!product_id(
          id, product_id, seller_id, source_id, price, currency,
          location_id, source_url, source_external_id,
          posted_at, status, raw_data,
          seller:sellers(*)
        )
      `)
      .eq('offers.source_id', 'revolico')
      .order('created_at', { ascending: false });

    if (params?.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, (params.offset + (params.limit ?? 20)) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []) as ProductWithOffers[];
  },
};
