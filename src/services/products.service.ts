/**
 * Dónde Hay - Products Service
 * Endpoints de productos y ofertas
 */

import { httpClient } from '@/lib/api-client';
import type {
  Product,
  ProductWithOffers,
  ProductOffer,
  PaginatedResponse,
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
   * Get paginated list of products
   */
  list: (params?: ProductListParams) =>
    httpClient.get<PaginatedResponse<ProductWithOffers>>('/products', { params: params as Record<string, unknown> }),

  /**
   * Get product detail with all offers
   */
  detail: (id: string) =>
    httpClient.get<ProductWithOffers>(`/products/${id}`),

  /**
   * Get offers for a specific product
   */
  offers: (productId: string, params?: { sourceIds?: string[]; status?: string }) =>
    httpClient.get<ProductOffer[]>(`/products/${productId}/offers`, { params: params as Record<string, unknown> }),

  /**
   * Get price history for a product
   */
  priceHistory: (productId: string, params?: { period?: '7d' | '30d' | '90d' }) =>
    httpClient.get<PriceHistory[]>(`/products/${productId}/price-history`, { params: params as Record<string, unknown> }),

  /**
   * Get trending/popular products
   */
  trending: (params?: { limit?: number; locationId?: string }) =>
    httpClient.get<TrendingProduct[]>('/products/trending', { params }),

  /**
   * Get products near a location
   */
  nearby: (params: { latitude: number; longitude: number; radius?: number; limit?: number }) =>
    httpClient.get<ProductWithOffers[]>('/products/nearby', { params }),

  /**
   * Get related/similar products
   */
  related: (productId: string, params?: { limit?: number }) =>
    httpClient.get<ProductWithOffers[]>(`/products/${productId}/related`, { params }),

  /**
   * Report a product issue
   */
  report: (productId: string, data: { reason: string; description?: string }) =>
    httpClient.post(`/products/${productId}/report`, data),
};
