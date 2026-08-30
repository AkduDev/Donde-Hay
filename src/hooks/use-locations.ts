/**
 * Dónde Hay - useLocations Hook
 * Hooks de ubicaciones con TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { locationsService } from '@/services/locations.service';
import { queryKeys } from '@/lib/api-client';

// ============================================
// QUERIES
// ============================================

/**
 * Get all provinces
 */
export function useProvinces() {
  return useQuery({
    queryKey: queryKeys.locations.provinces(),
    queryFn: () => locationsService.provinces(),
    staleTime: 1000 * 60 * 60, // 1 hour (rarely changes)
  });
}

/**
 * Get municipalities for a province
 */
export function useMunicipalities(provinceId: string) {
  return useQuery({
    queryKey: queryKeys.locations.municipalities(provinceId),
    queryFn: () => locationsService.municipalities(provinceId),
    enabled: !!provinceId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Get location detail
 */
export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', 'detail', id],
    queryFn: () => locationsService.detail(id),
    enabled: !!id,
  });
}

/**
 * Reverse geocode coordinates
 */
export function useReverseGeocode(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: ['locations', 'reverse-geocode', latitude, longitude],
    queryFn: () => locationsService.reverseGeocode(latitude!, longitude!),
    enabled: !!latitude && !!longitude,
  });
}

/**
 * Get coordinates (lat/lng) for a batch of location ids — usado por el mapa.
 */
export function useLocationsByIds(
  ids: string[]
): { data: Record<string, { name: string; latitude: number; longitude: number }> | undefined; isLoading: boolean } {
  const query = useQuery({
    queryKey: ['locations', 'by-ids', ids],
    queryFn: () => locationsService.byIds(ids),
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return { data: query.data, isLoading: query.isLoading };
}
