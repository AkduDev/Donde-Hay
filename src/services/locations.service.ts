/**
 * Dónde Hay - Locations Service
 * Endpoints de ubicaciones (provincias, municipios)
 */

import { httpClient } from '@/lib/api-client';
import type { Location } from '@/types';

// ============================================
// TYPES
// ============================================

export interface Province extends Location {
  productCount: number;
  municipalities?: Municipality[];
}

export interface Municipality extends Location {
  productCount: number;
}

// ============================================
// SERVICE
// ============================================

export const locationsService = {
  /**
   * Get all provinces
   */
  provinces: () =>
    httpClient.get<Province[]>('/locations/provinces', { skipAuth: true }),

  /**
   * Get municipalities for a province
   */
  municipalities: (provinceId: string) =>
    httpClient.get<Municipality[]>(`/locations/provinces/${provinceId}/municipalities`, {
      skipAuth: true,
    }),

  /**
   * Get location detail
   */
  detail: (id: string) =>
    httpClient.get<Location>(`/locations/${id}`, { skipAuth: true }),

  /**
   * Reverse geocode coordinates to location
   */
  reverseGeocode: (latitude: number, longitude: number) =>
    httpClient.get<Location>('/locations/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
      skipAuth: true,
    }),
};
