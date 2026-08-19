/**
 * Dónde Hay - useProducts Hook
 * Hooks de productos con TanStack Query
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { queryKeys } from '@/lib/api-client';
import type { ProductListParams } from '@/services/products.service';

// ============================================
// QUERIES
// ============================================

/**
 * Get paginated product list
 */
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsService.list(params),
  });
}

/**
 * Infinite scroll product list
 */
export function useInfiniteProducts(params?: Omit<ProductListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ pageParam = 1 }) =>
      productsService.list({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return totalLoaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Get product detail
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsService.detail(id),
    enabled: !!id,
  });
}

/**
 * Get product offers
 */
export function useProductOffers(productId: string, sourceIds?: string[]) {
  return useQuery({
    queryKey: queryKeys.products.offers(productId),
    queryFn: () => productsService.offers(productId, { sourceIds }),
    enabled: !!productId,
  });
}

/**
 * Get price history
 */
export function usePriceHistory(productId: string, period?: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: queryKeys.products.priceHistory(productId),
    queryFn: () => productsService.priceHistory(productId, { period }),
    enabled: !!productId,
  });
}

/**
 * Get trending products
 */
export function useTrending(limit?: number) {
  return useQuery({
    queryKey: queryKeys.products.trending(),
    queryFn: () => productsService.trending({ limit }),
  });
}

/**
 * Get nearby products
 */
export function useNearbyProducts(
  latitude: number,
  longitude: number,
  radius?: number
) {
  return useQuery({
    queryKey: queryKeys.products.nearby({ latitude, longitude }),
    queryFn: () => productsService.nearby({ latitude, longitude, radius }),
    enabled: !!latitude && !!longitude,
  });
}

/**
 * Get related products
 */
export function useRelatedProducts(productId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => productsService.related(productId, { limit }),
    enabled: !!productId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Report product mutation
 */
export function useReportProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, reason, description }: {
      productId: string;
      reason: string;
      description?: string;
    }) => productsService.report(productId, { reason, description }),
  });
}
