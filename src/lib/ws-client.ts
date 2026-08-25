/**
 * Dónde Hay - Real-time WebSocket Client
 * Supabase Realtime channels para suscripciones en vivo
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export type ConnectionState = 'connected' | 'disconnected' | 'error' | 'connecting' | 'discovered';

export interface ConnectionStateChangeEvent {
  status: ConnectionState;
  channel: string;
  error?: Error;
}

type ConnectionCallback = (event: ConnectionStateChangeEvent) => void;

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: T;
  old: Partial<T>;
  table: string;
  schema: string;
}

// ============================================
// CONNECTION STATE TRACKING
// ============================================

const connectionListeners = new Set<ConnectionCallback>();
let activeChannels = new Map<string, RealtimeChannel>();
let connectionState: ConnectionState = 'discovered';

function notifyConnectionListeners(event: ConnectionStateChangeEvent) {
  connectionListeners.forEach((cb) => {
    try {
      cb(event);
    } catch {
      // Prevent listener errors from breaking the loop
    }
  });
}

// Listen to Supabase auth state to track WS lifecycle
supabase.channel('connection-monitor').on('system', { event: '*' }, (payload) => {
  const status = payload['status'] as string | undefined;
  if (status === 'ok') {
    connectionState = 'connected';
    notifyConnectionListeners({ status: 'connected', channel: 'system' });
  } else if (status === 'closed') {
    connectionState = 'disconnected';
    notifyConnectionListeners({ status: 'disconnected', channel: 'system' });
  } else if (status === 'error') {
    connectionState = 'error';
    notifyConnectionListeners({ status: 'error', channel: 'system' });
  }
}).subscribe();

// ============================================
// PUBLIC API: CONNECTION STATE
// ============================================

export function onConnectionStateChange(callback: ConnectionCallback): () => void {
  connectionListeners.add(callback);
  return () => {
    connectionListeners.delete(callback);
  };
}

export function getConnectionState(): ConnectionState {
  return connectionState;
}

// ============================================
// INTERNAL: CHANNEL MANAGEMENT
// ============================================

function getChannelName(topic: string): string {
  return `donde-hay:${topic}`;
}

function trackChannel(topic: string, channel: RealtimeChannel) {
  const name = getChannelName(topic);
  const existing = activeChannels.get(name);
  if (existing) {
    supabase.removeChannel(existing);
  }
  activeChannels.set(name, channel);
}

function untrackChannel(topic: string) {
  const name = getChannelName(topic);
  const channel = activeChannels.get(name);
  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(name);
  }
}

// ============================================
// ALERTS SUBSCRIPTION
// ============================================

export function subscribeToAlerts(
  callback: (payload: RealtimePayload) => void
): RealtimeChannel {
  const topic = 'alerts';

  const channel = supabase
    .channel(getChannelName(topic))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'price_alerts',
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        callback({
          eventType: payload['eventType'] as RealtimePayload['eventType'],
          new: (payload['new'] || {}) as Record<string, unknown>,
          old: (payload['old'] || {}) as Partial<Record<string, unknown>>,
          table: 'price_alerts',
          schema: 'public',
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        notifyConnectionListeners({ status: 'connected', channel: topic });
      } else if (status === 'CHANNEL_ERROR') {
        notifyConnectionListeners({
          status: 'error',
          channel: topic,
          error: new Error(`Alerts subscription error`),
        });
      }
    });

  trackChannel(topic, channel);
  return channel;
}

export function unsubscribeFromAlerts(channel?: RealtimeChannel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
  untrackChannel('alerts');
}

// ============================================
// PRODUCT UPDATES SUBSCRIPTION
// ============================================

export function subscribeToProductUpdates(
  productId: string,
  callback: (payload: RealtimePayload) => void
): RealtimeChannel {
  const topic = `product:${productId}`;

  const channel = supabase
    .channel(getChannelName(topic))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_offers',
        filter: `product_id=eq.${productId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        callback({
          eventType: payload['eventType'] as RealtimePayload['eventType'],
          new: (payload['new'] || {}) as Record<string, unknown>,
          old: (payload['old'] || {}) as Partial<Record<string, unknown>>,
          table: 'product_offers',
          schema: 'public',
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        notifyConnectionListeners({ status: 'connected', channel: topic });
      } else if (status === 'CHANNEL_ERROR') {
        notifyConnectionListeners({
          status: 'error',
          channel: topic,
          error: new Error(`Product ${productId} subscription error`),
        });
      }
    });

  trackChannel(topic, channel);
  return channel;
}

export function unsubscribeFromProductUpdates(
  productId: string,
  channel?: RealtimeChannel
) {
  if (channel) {
    supabase.removeChannel(channel);
  }
  untrackChannel(`product:${productId}`);
}

// ============================================
// SAVED SEARCHES SUBSCRIPTION
// ============================================

export function subscribeToSavedSearches(
  callback: (payload: RealtimePayload) => void
): RealtimeChannel {
  const topic = 'saved-searches';

  const channel = supabase
    .channel(getChannelName(topic))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'saved_searches',
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        callback({
          eventType: payload['eventType'] as RealtimePayload['eventType'],
          new: (payload['new'] || {}) as Record<string, unknown>,
          old: (payload['old'] || {}) as Partial<Record<string, unknown>>,
          table: 'saved_searches',
          schema: 'public',
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        notifyConnectionListeners({ status: 'connected', channel: topic });
      } else if (status === 'CHANNEL_ERROR') {
        notifyConnectionListeners({
          status: 'error',
          channel: topic,
          error: new Error('Saved searches subscription error'),
        });
      }
    });

  trackChannel(topic, channel);
  return channel;
}

export function unsubscribeFromSavedSearches(channel?: RealtimeChannel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
  untrackChannel('saved-searches');
}

// ============================================
// CLEANUP ALL
// ============================================

export function unsubscribeAll() {
  activeChannels.forEach((channel, name) => {
    supabase.removeChannel(channel);
  });
  activeChannels.clear();
}

export function getActiveChannelCount(): number {
  return activeChannels.size;
}
