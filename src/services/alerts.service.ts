/**
 * Dónde Hay - Alerts Service
 * Alertas de precio con Supabase
 */

import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

// ============================================
// TYPES
// ============================================

export interface CreateAlertRequest {
  productId: string;
  targetPrice: number;
  currency?: 'USD' | 'CUP' | 'MLC';
  direction?: 'below' | 'above';
}

export interface UpdateAlertRequest {
  targetPrice?: number;
  currency?: 'USD' | 'CUP' | 'MLC';
  direction?: 'below' | 'above';
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================

export const alertsService = {
  /**
   * Get user's alerts
   */
  list: async (): Promise<Alert[]> => {
    const { data, error } = await supabase
      .from('price_alerts')
      .select(`
        *,
        product:products(
          id,
          canonical_name,
          brand,
          model,
          image_urls
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Alert[];
  },

  /**
   * Create new alert
   */
  create: async (data: CreateAlertRequest): Promise<Alert> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        product_id: data.productId,
        target_price: data.targetPrice,
        currency: data.currency || 'USD',
        direction: data.direction || 'below',
      })
      .select()
      .single();

    if (error) throw error;
    return alert as unknown as Alert;
  },

  /**
   * Update alert
   */
  update: async (id: string, data: UpdateAlertRequest): Promise<Alert> => {
    const updateData: Record<string, unknown> = {};
    if (data.targetPrice !== undefined) updateData['target_price'] = data.targetPrice;
    if (data.currency !== undefined) updateData['currency'] = data.currency;
    if (data.direction !== undefined) updateData['direction'] = data.direction;
    if (data.isActive !== undefined) updateData['is_active'] = data.isActive;

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return alert as unknown as Alert;
  },

  /**
   * Delete alert
   */
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle alert active status
   */
  toggle: async (id: string, isActive: boolean): Promise<Alert> => {
    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return alert as unknown as Alert;
  },

  /**
   * Get alert matches (products that matched)
   */
  matches: async (id: string, params?: { page?: number; limit?: number }): Promise<unknown[]> => {
    const { page = 1, limit = 20 } = params || {};
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('product_offers')
      .select(`
        *,
        product:products(
          id,
          canonical_name,
          brand,
          model,
          image_urls
        ),
        seller:sellers(
          id,
          name,
          phone
        )
      `)
      .eq('product_id', id)
      .eq('status', 'active')
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },
};
