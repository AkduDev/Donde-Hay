/**
 * Dónde Hay - Locations Service
 * Ubicaciones + geolocalización con Supabase
 */

import { supabase } from '@/lib/supabase';
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

export interface NearbyProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  distance: number;
  postedAt: string;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// SERVICE
// ============================================

export const locationsService = {
  /**
   * Get all provinces
   */
  provinces: async (): Promise<Province[]> => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'province')
      .order('name');

    if (error) throw error;

    // Get product counts for each province
    const provincesWithCounts = await Promise.all(
      (data || []).map(async (province) => {
        const { count } = await supabase
          .from('product_offers')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', province.id)
          .eq('status', 'active');

        return {
          ...province,
          productCount: count || 0,
        };
      })
    );

    return provincesWithCounts;
  },

  /**
   * Get municipalities for a province
   */
  municipalities: async (provinceId: string): Promise<Municipality[]> => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('parent_id', provinceId)
      .eq('type', 'municipality')
      .order('name');

    if (error) throw error;

    // Get product counts for each municipality
    const municipalitiesWithCounts = await Promise.all(
      (data || []).map(async (municipality) => {
        const { count } = await supabase
          .from('product_offers')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', municipality.id)
          .eq('status', 'active');

        return {
          ...municipality,
          productCount: count || 0,
        };
      })
    );

    return municipalitiesWithCounts;
  },

  /**
   * Get location detail
   */
  detail: async (id: string): Promise<Location> => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Reverse geocode coordinates to location
   */
  reverseGeocode: async (latitude: number, longitude: number): Promise<Location | null> => {
    // Find nearest location using Haversine-like query via Supabase RPC
    const { data, error } = await supabase
      .rpc('find_nearest_location', {
        lat: latitude,
        lng: longitude,
      });

    if (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }

    return data;
  },

  /**
   * Find nearby products using PostGIS or haversine calculation
   */
  nearbyProducts: async (params: NearbySearchParams): Promise<NearbyProduct[]> => {
    const {
      latitude,
      longitude,
      radiusKm = 25,
      categoryId,
      limit = 20,
      offset = 0,
    } = params;

    // Use Supabase RPC for geospatial query
    const { data, error } = await supabase
      .rpc('find_nearby_products', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
        category_id: categoryId || null,
        result_limit: limit,
        result_offset: offset,
      });

    if (error) {
      console.error('Nearby products error:', error);
      throw error;
    }

    return data || [];
  },
};
