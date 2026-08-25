/**
 * Dónde Hay - useRealtimeProduct Hook
 * Suscripción en vivo a cambios en product_offers de un producto
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api-client';
import {
  subscribeToProductUpdates,
  unsubscribeFromProductUpdates,
  onConnectionStateChange,
  type ConnectionState,
  type RealtimePayload,
} from '@/lib/ws-client';
import type { ProductOffer } from '@/types';

// ============================================
// HOOK
// ============================================

export function useRealtimeProduct(productId: string | null) {
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimePayload | null>(null);
  const channelRef = useRef<ReturnType<typeof subscribeToProductUpdates> | null>(null);
  const queryClient = useQueryClient();

  const handleOfferChange = useCallback(
    (payload: RealtimePayload) => {
      setLastEvent(payload);

      const offerData = payload.new as Record<string, unknown>;

      setOffers((prev) => {
        switch (payload.eventType) {
          case 'INSERT': {
            const newOffer = mapOffer(offerData);
            // Avoid duplicates
            if (prev.some((o) => o.id === newOffer.id)) return prev;
            return [newOffer, ...prev];
          }
          case 'UPDATE': {
            return prev.map((o) =>
              o.id === offerData['id']
                ? {
                    ...o,
                    price: Number(offerData['price'] ?? o.price),
                    currency:
                      (offerData['currency'] as ProductOffer['currency']) ?? o.currency,
                    status:
                      (offerData['status'] as ProductOffer['status']) ?? o.status,
                    sourceUrl:
                      (offerData['source_url'] as string) ?? o.sourceUrl,
                  }
                : o
            );
          }
          case 'DELETE': {
            const deletedId = payload.old['id'] as string | undefined;
            return prev.filter((o) => o.id !== deletedId);
          }
          default:
            return prev;
        }
      });

      // Invalidate related queries
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.offers(productId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(productId),
        });
      }
    },
    [productId, queryClient]
  );

  // Subscribe when productId is provided
  useEffect(() => {
    if (!productId) {
      setOffers([]);
      return;
    }

    channelRef.current = subscribeToProductUpdates(productId, handleOfferChange);

    return () => {
      if (channelRef.current && productId) {
        unsubscribeFromProductUpdates(productId, channelRef.current);
        channelRef.current = null;
      }
    };
  }, [productId, handleOfferChange]);

  // Track connection status
  useEffect(() => {
    const unsub = onConnectionStateChange((event) => {
      if (event.channel === `product:${productId}` || event.channel === 'system') {
        setConnectionStatus(event.status);
      }
    });
    return unsub;
  }, [productId]);

  const refetch = useCallback(() => {
    if (productId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.offers(productId),
      });
    }
  }, [productId, queryClient]);

  return {
    offers,
    connectionStatus,
    lastEvent,
    refetch,
  };
}

// ============================================
// HELPERS
// ============================================

function mapOffer(data: Record<string, unknown>): ProductOffer {
  return {
    id: data['id'] as string,
    productId: data['product_id'] as string,
    sellerId: data['seller_id'] as string,
    sourceId: data['source_id'] as string,
    price: Number(data['price']),
    currency: data['currency'] as ProductOffer['currency'],
    locationId: data['location_id'] as string,
    sourceUrl: data['source_url'] as string,
    sourceExternalId: (data['source_external_id'] as string) ?? undefined,
    postedAt: data['posted_at'] as string,
    status: data['status'] as ProductOffer['status'],
    rawData: (data['raw_data'] as Record<string, unknown>) ?? undefined,
  };
}
