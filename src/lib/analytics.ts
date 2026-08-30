/**
 * Dónde Hay - Analytics
 * Event tracking con proveedor real: los eventos se encolan en AsyncStorage
 * y se envían por HTTP en batches al endpoint configurado
 * (EXPO_PUBLIC_ANALYTICS_ENDPOINT). Si no hay endpoint, quedan en cola local
 * para debug en dev.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ANALYTICS_CONFIG, APP_CONFIG } from "@/config";

// ============================================
// TYPES
// ============================================

export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  properties?: Record<string, unknown>;
  sessionId: string;
  platform: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  flushIntervalMs: number;
  maxQueueSize: number;
}

// ============================================
// CONFIGURATION
// ============================================

const STORAGE_KEY = "@dondehay_analytics_queue";
const SESSION_KEY = "@dondehay_analytics_session";
const FLUSH_THRESHOLD = 20;

let config: AnalyticsConfig = {
  enabled: process.env['EXPO_PUBLIC_ENABLE_ANALYTICS'] === "true",
  flushIntervalMs: 60_000, // 1 minute
  maxQueueSize: 100,
};

let sessionId = "";
let flushTimer: ReturnType<typeof setInterval> | null = null;

// ============================================
// SESSION MANAGEMENT
// ============================================

async function ensureSession(): Promise<string> {
  if (sessionId) return sessionId;

  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) {
      sessionId = stored;
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await AsyncStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch {
    sessionId = `session_${Date.now()}_fallback`;
  }

  return sessionId;
}

// ============================================
// CORE API
// ============================================

/**
 * Track an analytics event.
 * Events are queued locally and flushed periodically.
 */
export async function track(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!config.enabled) return;

  try {
    const sid = await ensureSession();
    const event: AnalyticsEvent = {
      name: eventName,
      timestamp: Date.now(),
      properties: { appRelease: APP_CONFIG.version, ...properties },
      sessionId: sid,
      platform: Platform.OS,
    };

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const queue: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];

    queue.push(event);

    // Cap queue size
    if (queue.length > config.maxQueueSize) {
      queue.splice(0, queue.length - config.maxQueueSize);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

    // Auto-flush at threshold
    if (queue.length >= FLUSH_THRESHOLD) {
      await flush();
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/**
 * Flush de eventos encolados al endpoint real (POST JSON en batch).
 * Solo limpia la cola cuando el envío tiene éxito; si falla, retiene para reintentar.
 */
export async function flush(): Promise<void> {
  if (!config.enabled) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const queue: AnalyticsEvent[] = JSON.parse(raw);
    if (queue.length === 0) return;

    if (__DEV__) {
      console.log(`[Analytics] Flushing ${queue.length} events`);
      for (const event of queue) {
        console.log(`  → ${event.name}`, event.properties ?? "");
      }
    }

    const endpoint = ANALYTICS_CONFIG.endpoint;

    if (endpoint) {
      const insession = await ensureSession();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          app: APP_CONFIG.name,
          version: APP_CONFIG.version,
          sessionId: insession,
          platform: Platform.OS,
          events: queue,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Mantener la cola para el siguiente intento
        console.warn(`[Analytics] Flush rechazado (${response.status}) — se reintentará`);
        return;
      }
    }

    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // No crashar nunca por analytics; la cola se conserva y se reintentará
  }
}

/**
 * Start auto-flushing on an interval.
 */
export function startAutoFlush(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flush();
  }, config.flushIntervalMs);
}

/**
 * Stop auto-flushing.
 */
export function stopAutoFlush(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/**
 * Update analytics config at runtime.
 */
export function configure(newConfig: Partial<AnalyticsConfig>): void {
  config = { ...config, ...newConfig };
}

// ============================================
// CONVENIENCE TRACKING FUNCTIONS
// ============================================

/** Track a screen view */
export function trackScreen(screenName: string, params?: Record<string, unknown>): void {
  track("screen_view", { screen: screenName, ...params });
}

/** Track a search query */
export function trackSearch(query: string, resultCount: number): void {
  track("search", { query, resultCount });
}

/** Track product view */
export function trackProductView(productId: string, source: string): void {
  track("product_view", { productId, source });
}

/** Track favorite toggle */
export function trackFavorite(productId: string, action: "add" | "remove"): void {
  track("favorite", { productId, action });
}

/** Track price alert creation */
export function trackAlertCreated(productId: string, targetPrice: number): void {
  track("alert_created", { productId, targetPrice });
}

/** Track error occurrence */
export function trackError(errorName: string, message: string, context?: string): void {
  track("error", { errorName, message, context });
}

/** Track feature usage */
export function trackFeature(feature: string, action: string): void {
  track("feature_usage", { feature, action });
}

// ============================================
// QUEUE INSPECTION (for debugging)
// ============================================

/**
 * Get the current queue size (for debug UI).
 */
export async function getQueueSize(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
}

/**
 * Get the current session ID.
 */
export async function getSessionId(): Promise<string> {
  return ensureSession();
}
