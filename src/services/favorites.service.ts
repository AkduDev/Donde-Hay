/**
 * Dónde Hay - Favorites Service
 * Favoritos y búsquedas guardadas desde Supabase
 */

import { supabase } from '@/lib/supabase';
import type { Favorite, ProductWithOffers, Seller, SavedSearch, SearchQuery } from '@/types';

// ============================================
// SERVICE
// ============================================

export const favoritesService = {
  /**
   * Get user's favorites
   */
  list: async (type?: 'product' | 'search' | 'seller'): Promise<Favorite[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      targetId: item.target_id,
      createdAt: item.created_at,
    }));
  },

  /**
   * Add item to favorites
   */
  add: async (data: { type: 'product' | 'search' | 'seller'; targetId: string }): Promise<Favorite> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        type: data.type,
        target_id: data.targetId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: favorite.id,
      userId: favorite.user_id,
      type: favorite.type,
      targetId: favorite.target_id,
      createdAt: favorite.created_at,
    };
  },

  /**
   * Remove item from favorites
   */
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Check if item is favorited
   */
  check: async (type: string, targetId: string): Promise<{ isFavorite: boolean }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isFavorite: false };

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('target_id', targetId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { isFavorite: !!data };
  },

  /**
   * Get favorite products with details
   */
  products: async (): Promise<ProductWithOffers[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('target_id')
      .eq('user_id', user.id)
      .eq('type', 'product');

    if (favError) throw favError;

    if (!favorites || favorites.length === 0) return [];

    const productIds = favorites.map((f) => f.target_id);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        offers:product_offers(*, seller:sellers(*)),
        category:categories(name, slug)
      `)
      .in('id', productIds);

    if (error) throw error;

    return (data || []) as ProductWithOffers[];
  },

  /**
   * Get favorite sellers with details
   */
  sellers: async (): Promise<Seller[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('target_id')
      .eq('user_id', user.id)
      .eq('type', 'seller');

    if (favError) throw favError;

    if (!favorites || favorites.length === 0) return [];

    const sellerIds = favorites.map((f) => f.target_id);

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .in('id', sellerIds);

    if (error) throw error;

    return (data || []) as Seller[];
  },

  /**
   * Get saved searches
   */
  searches: async (): Promise<SavedSearch[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      query: item.query as SearchQuery,
      name: item.name || '',
      notifyEnabled: item.notify_enabled,
      createdAt: item.created_at,
      updatedAt: item.created_at,
    }));
  },

  /**
   * Save a search
   */
  saveSearch: async (data: { query: string; name?: string; notifyEnabled?: boolean }): Promise<SavedSearch> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: search, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        query: data.query,
        name: data.name,
        notify_enabled: data.notifyEnabled || false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: search.id,
      userId: search.user_id,
      query: search.query as SearchQuery,
      name: search.name || '',
      notifyEnabled: search.notify_enabled,
      createdAt: search.created_at,
      updatedAt: search.created_at,
    };
  },

  /**
   * Delete saved search
   */
  deleteSearch: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle save search notification
   */
  toggleSearchNotification: async (id: string, enabled: boolean): Promise<SavedSearch> => {
    const { data, error } = await supabase
      .from('saved_searches')
      .update({ notify_enabled: enabled })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      query: data.query as SearchQuery,
      name: data.name || '',
      notifyEnabled: data.notify_enabled,
      createdAt: data.created_at,
      updatedAt: data.created_at,
    };
  },
};
