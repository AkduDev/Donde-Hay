/**
 * Dónde Hay - Sellers Service
 * Endpoints de vendedores
 */

import { httpClient } from '@/lib/api-client';
import type { Seller, ProductWithOffers, PaginatedResponse } from '@/types';

// ============================================
// TYPES
// ============================================

export interface SellerWithProducts extends Seller {
  productsCount: number;
  averageRating: number;
}

export interface SellerProductsParams {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
}

// ============================================
// SERVICE
// ============================================

export const sellersService = {
  /**
   * Get seller detail
   */
  detail: (id: string) =>
    httpClient.get<SellerWithProducts>(`/sellers/${id}`),

  /**
   * Get seller's products
   */
  products: (id: string, params?: SellerProductsParams) =>
    httpClient.get<PaginatedResponse<ProductWithOffers>>(`/sellers/${id}/products`, { params: params as Record<string, unknown> }),

  /**
   * Get seller reviews (future)
   */
  reviews: (id: string, params?: { page?: number; limit?: number }) =>
    httpClient.get(`/sellers/${id}/reviews`, { params }),

  /**
   * Report seller
   */
  report: (id: string, data: { reason: string; description?: string }) =>
    httpClient.post(`/sellers/${id}/report`, data),

  /**
   * Verify seller (admin only)
   */
  verify: (id: string) =>
    httpClient.patch<Seller>(`/sellers/${id}/verify`),
};
