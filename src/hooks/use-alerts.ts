/**
 * Dónde Hay - useAlerts Hook
 * Hooks de alertas de precio con TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '@/services/alerts.service';
import { queryKeys } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import type { CreateAlertRequest, UpdateAlertRequest } from '@/services/alerts.service';

// ============================================
// QUERIES
// ============================================

/**
 * Get user's alerts
 */
export function useAlerts() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.alerts.list(),
    queryFn: () => alertsService.list(),
    enabled: isAuthenticated,
  });
}

/**
 * Get alert matches
 */
export function useAlertMatches(alertId: string, page?: number, limit?: number) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['alerts', 'matches', alertId],
    queryFn: () => alertsService.matches(alertId, { page, limit }),
    enabled: isAuthenticated && !!alertId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create alert
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlertRequest) => alertsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
    },
  });
}

/**
 * Update alert
 */
export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRequest }) =>
      alertsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
    },
  });
}

/**
 * Delete alert
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
    },
  });
}

/**
 * Toggle alert active status
 */
export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      alertsService.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
    },
  });
}
