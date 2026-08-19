/**
 * Dónde Hay - Categories Service
 * Endpoints de categorías
 */

import { httpClient } from '@/lib/api-client';
import type { ProductWithOffers } from '@/types';
import type { PaginatedResponse } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  parentId?: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryProductsParams {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sourceIds?: string[];
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
}

// ============================================
// SERVICE
// ============================================

export const categoriesService = {
  /**
   * Get all categories
   */
  list: () =>
    httpClient.get<Category[]>('/categories', { skipAuth: true }),

  /**
   * Get category detail by slug
   */
  detail: (slug: string) =>
    httpClient.get<Category>(`/categories/${slug}`, { skipAuth: true }),

  /**
   * Get products in a category
   */
  products: (slug: string, params?: CategoryProductsParams) =>
    httpClient.get<PaginatedResponse<ProductWithOffers>>(`/categories/${slug}/products`, { params: params as Record<string, unknown> }),
};
