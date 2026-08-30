/**
 * Dónde Hay - useRealtimeAlerts Hook
 * Suscripción en vivo a cambios en price_alerts del usuario
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/lib/api-client';
import {
  subscribeToAlerts,
  unsubscribeFromAlerts,
  onConnectionStateChange,
  type ConnectionState,
  type RealtimePayload,
} from '@/lib/ws-client';
import type { Alert } from '@/types';

// ============================================
// HOOK
// ============================================

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimePayload | null>(null);
  const channelRef = useRef<ReturnType<typeof subscribeToAlerts> | null>(null);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const handleAlertChange = useCallback(
    (payload: RealtimePayload) => {
      setLastEvent(payload);

      if (!user) return;

      // Filter events for current user
      const alertData = payload.new as Record<string, unknown>;
      if (alertData['user_id'] !== user.id) return;

      setAlerts((prev) => {
        switch (payload.eventType) {
          case 'INSERT': {
            const newAlert = {
              id: alertData['id'] as string,
              userId: alertData['user_id'] as string,
              productId: alertData['product_id'] as string,
              targetPrice: Number(alertData['target_price']),
              currency: alertData['currency'] as Alert['currency'],
              direction: alertData['direction'] as Alert['direction'],
              isActive: alertData['is_active'] as boolean,
              lastNotifiedAt: alertData['last_notified_at'] as string | undefined,
              createdAt: alertData['created_at'] as string,
            } as Alert;
            return [newAlert, ...prev];
          }
          case 'UPDATE': {
            return prev.map((a) =>
              a.id === alertData['id']
                ? {
                    ...a,
                    targetPrice: Number(alertData['target_price'] ?? a.targetPrice),
                    currency: (alertData['currency'] as Alert['currency']) ?? a.currency,
                    direction: (alertData['direction'] as Alert['direction']) ?? a.direction,
                    isActive: (alertData['is_active'] as boolean) ?? a.isActive,
                    lastNotifiedAt:
                      (alertData['last_notified_at'] as string) ?? a.lastNotifiedAt,
                  }
                : a
            );
          }
          case 'DELETE': {
            const deletedId = payload.old['id'] as string | undefined;
            return prev.filter((a) => a.id !== deletedId);
          }
          default:
            return prev;
        }
      });

      // Invalidate TanStack Query cache so other hooks refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
    },
    [user, queryClient]
  );

  // Subscribe on mount / auth change
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    channelRef.current = subscribeToAlerts(handleAlertChange);

    return () => {
      if (channelRef.current) {
        unsubscribeFromAlerts(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, user, handleAlertChange]);

  // Track connection status
  useEffect(() => {
    const unsub = onConnectionStateChange((event) => {
      if (event.channel === 'alerts' || event.channel === 'system') {
        setConnectionStatus(event.status);
      }
    });
    return unsub;
  }, []);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts.list() });
  }, [queryClient]);

  const activeAlerts = isAuthenticated && user ? alerts : [];

  return {
    alerts: activeAlerts,
    connectionStatus,
    lastEvent,
    refetch,
  };
}
