/**
 * Dónde Hay - useCategories Hook
 * Hooks de categorías con TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories.service';
import { queryKeys } from '@/lib/api-client';
import type { CategoryProductsParams } from '@/services/categories.service';

// ============================================
// QUERIES
// ============================================

/**
 * Get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoriesService.list(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Get category detail by slug
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => categoriesService.detail(slug),
    enabled: !!slug,
  });
}

/**
 * Get products in a category
 */
export function useCategoryProducts(slug: string, params?: CategoryProductsParams) {
  return useQuery({
    queryKey: queryKeys.categories.products(slug, params),
    queryFn: () => categoriesService.products(slug, params),
    enabled: !!slug,
  });
}
