/**
 * Dónde Hay - useSellers Hook
 * Hooks de vendedores con TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { sellersService } from '@/services/sellers.service';
import type { SellerProductsParams } from '@/services/sellers.service';

// ============================================
// QUERIES
// ============================================

/**
 * Get seller detail
 */
export function useSeller(id: string) {
  return useQuery({
    queryKey: ['sellers', 'detail', id],
    queryFn: () => sellersService.detail(id),
    enabled: !!id,
  });
}

/**
 * Get seller's products
 */
export function useSellerProducts(id: string, params?: SellerProductsParams) {
  return useQuery({
    queryKey: ['sellers', 'products', id, params],
    queryFn: () => sellersService.products(id, params),
    enabled: !!id,
  });
}

/**
 * Get seller reviews (future)
 */
export function useSellerReviews(id: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ['sellers', 'reviews', id],
    queryFn: () => sellersService.reviews(id, { page, limit }),
    enabled: !!id,
  });
}
