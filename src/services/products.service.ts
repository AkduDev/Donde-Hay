/**
 * Dónde Hay - Products Service
 * Productos y ofertas desde Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
  ProductWithOffers,
  ProductOffer,
} from '@/types';

// ============================================
// TYPES
// ============================================

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  locationId?: string;
  minPrice?: number;
  maxPrice?: number;
  sourceIds?: string[];
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
}

export interface TrendingProduct {
  id: string;
  canonicalName: string;
  brand: string;
  model: string;
  imageUrls: string[];
  offerCount: number;
  minPrice: number;
  currency: string;
}

export interface PriceHistory {
  date: string;
  price: number;
  currency: string;
  sourceId: string;
}

// ============================================
// SERVICE
// ============================================

export const productsService = {
  /**
   * Get paginated list of products with offers
   */
  list: async (params?: ProductListParams): Promise<{ data: ProductWithOffers[]; total: number }> => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(name, slug)
      `, { count: 'exact' });

    if (params?.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }

    // Price filtering via offers
    if (params?.minPrice) {
      query = query.gte('product_offers.price', params.minPrice);
    }
    if (params?.maxPrice) {
      query = query.lte('product_offers.price', params.maxPrice);
    }

    // Source filtering
    if (params?.sourceIds && params.sourceIds.length > 0) {
      query = query.in('product_offers.source_id', params.sourceIds);
    }

    // Sorting
    switch (params?.sortBy) {
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

    return {
      data: (data || []) as ProductWithOffers[],
      total: count || 0,
    };
  },

  /**
   * Get product detail with all offers
   */
  detail: async (id: string): Promise<ProductWithOffers> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as ProductWithOffers;
  },

  /**
   * Get offers for a specific product
   */
  offers: async (productId: string, params?: { sourceIds?: string[]; status?: string }): Promise<ProductOffer[]> => {
    let query = supabase
      .from('product_offers')
      .select('*, seller:sellers(*)')
      .eq('product_id', productId);

    if (params?.sourceIds && params.sourceIds.length > 0) {
      query = query.in('source_id', params.sourceIds);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query.order('posted_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ProductOffer[];
  },

  /**
   * Get price history for a product (requires price_history table)
   */
  priceHistory: async (productId: string, _params?: { period?: '7d' | '30d' | '90d' }): Promise<PriceHistory[]> => {
    // For now, return offers as price history points
    const { data, error } = await supabase
      .from('product_offers')
      .select('price, currency, source_id, posted_at')
      .eq('product_id', productId)
      .order('posted_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      date: item.posted_at,
      price: item.price,
      currency: item.currency,
      sourceId: item.source_id,
    }));
  },

  /**
   * Get trending/popular products (most offers)
   */
  trending: async (params?: { limit?: number; locationId?: string }): Promise<TrendingProduct[]> => {
    const limit = params?.limit || 10;

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        canonical_name,
        brand,
        model,
        image_urls,
        offers:product_offers(price, currency, source_id)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((product) => {
      const offers = product.offers || [];
      const prices = offers.map((o: { price: number }) => o.price).filter(Boolean);
      return {
        id: product.id,
        canonicalName: product.canonical_name,
        brand: product.brand || '',
        model: product.model || '',
        imageUrls: product.image_urls || [],
        offerCount: offers.length,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        currency: offers[0]?.currency || 'USD',
      };
    });
  },

  /**
   * Get products near a location (requires PostGIS or lat/lng in offers)
   */
  nearby: async (params: { latitude: number; longitude: number; radius?: number; limit?: number }): Promise<ProductWithOffers[]> => {
    // Basic implementation - filter by location if available
    const limit = params.limit || 10;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(name, slug)
      `)
      .limit(limit);

    if (error) throw error;

    return (data || []) as ProductWithOffers[];
  },

  /**
   * Get related/similar products (by category)
   */
  related: async (productId: string, params?: { limit?: number }): Promise<ProductWithOffers[]> => {
    const limit = params?.limit || 6;

    // First get the product to find its category
    const { data: product } = await supabase
      .from('products')
      .select('category_id')
      .eq('id', productId)
      .single();

    if (!product?.category_id) return [];

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(name, slug)
      `)
      .eq('category_id', product.category_id)
      .neq('id', productId)
      .limit(limit);

    if (error) throw error;

    return (data || []) as ProductWithOffers[];
  },

  /**
   * Report a product issue (requires reports table)
   */
  report: async (productId: string, data: { reason: string; description?: string }): Promise<void> => {
    // TODO: Implement when reports table is created
    console.log('Report product:', productId, data);
  },
};
