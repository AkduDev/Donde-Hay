/**
 * Dónde Hay - Alerts Service
 * Endpoints de alertas de precio
 */

import { httpClient } from '@/lib/api-client';
import type { Alert } from '@/types';

// ============================================
// TYPES
// ============================================

export interface CreateAlertRequest {
  productQuery: string;
  maxPrice?: number;
  locationId?: string;
  sourceIds?: string[];
  frequency: 'realtime' | 'daily' | 'weekly';
}

export interface UpdateAlertRequest {
  productQuery?: string;
  maxPrice?: number;
  locationId?: string;
  sourceIds?: string[];
  frequency?: 'realtime' | 'daily' | 'weekly';
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================

export const alertsService = {
  /**
   * Get user's alerts
   */
  list: () =>
    httpClient.get<Alert[]>('/alerts'),

  /**
   * Create new alert
   */
  create: (data: CreateAlertRequest) =>
    httpClient.post<Alert>('/alerts', data),

  /**
   * Update alert
   */
  update: (id: string, data: UpdateAlertRequest) =>
    httpClient.patch<Alert>(`/alerts/${id}`, data),

  /**
   * Delete alert
   */
  remove: (id: string) =>
    httpClient.delete(`/alerts/${id}`),

  /**
   * Toggle alert active status
   */
  toggle: (id: string, isActive: boolean) =>
    httpClient.patch<Alert>(`/alerts/${id}`, { isActive }),

  /**
   * Get alert matches (products that matched)
   */
  matches: (id: string, params?: { page?: number; limit?: number }) =>
    httpClient.get(`/alerts/${id}/matches`, { params }),
};
