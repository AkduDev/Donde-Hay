/**
 * Dónde Hay - Monitoring
 * Simple console-based performance monitoring for the mobile app.
 * No external service dependency — logs locally in development,
 * can be swapped for Sentry/Datadog later.
 */

// ============================================
// TYPES
// ============================================

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AppEvent {
  name: string;
  timestamp: number;
  severity: "info" | "warn" | "error";
  metadata?: Record<string, unknown>;
}

// ============================================
// PERFORMANCE TIMING
// ============================================

const activeTimers = new Map<string, PerformanceMetric>();

/**
 * Start a performance timer.
 * Returns a stop function that records duration when called.
 */
export function startTimer(
  name: string,
  metadata?: Record<string, unknown>
): () => PerformanceMetric {
  const metric: PerformanceMetric = {
    name,
    startTime: Date.now(),
    metadata,
  };
  activeTimers.set(name, metric);

  return () => {
    metric.endTime = Date.now();
    metric.durationMs = metric.endTime - metric.startTime;
    activeTimers.delete(name);
    logMetric(metric);
    return metric;
  };
}

/**
 * Time an async operation automatically.
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const stop = startTimer(name, metadata);
  try {
    const result = await fn();
    stop();
    return result;
  } catch (err) {
    const metric = stop();
    console.error(
      `[Monitor] ${name} failed after ${metric.durationMs}ms:`,
      err
    );
    throw err;
  }
}

// ============================================
// EVENT LOGGING
// ============================================

const eventLog: AppEvent[] = [];
const MAX_LOG_SIZE = 200;

/**
 * Log an app event.
 */
export function logEvent(
  name: string,
  severity: AppEvent["severity"] = "info",
  metadata?: Record<string, unknown>
): void {
  const event: AppEvent = {
    name,
    timestamp: Date.now(),
    severity,
    metadata,
  };

  eventLog.push(event);
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.shift();
  }

  const prefix =
    severity === "error"
      ? "🔴"
      : severity === "warn"
        ? "🟡"
        : "🟢";

  if (__DEV__) {
    console.log(
      `[Monitor] ${prefix} ${name}`,
      metadata ? JSON.stringify(metadata) : ""
    );
  }
}

/**
 * Get recent events (for debugging / crash reports).
 */
export function getRecentEvents(count = 50): AppEvent[] {
  return eventLog.slice(-count);
}

// ============================================
// HEALTH CHECK
// ============================================

interface HealthCheckResult {
  healthy: boolean;
  checks: Record<string, { ok: boolean; durationMs?: number; error?: string }>;
  timestamp: number;
}

/**
 * Run basic health checks (network, storage, etc.).
 * Useful for debugging connection issues on Cuban networks.
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, { ok: boolean; durationMs?: number; error?: string }> = {};
  // Check: Network connectivity
  try {
    const netStart = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? "https://placeholder.supabase.co"}/rest/v1/?limit=1`,
      {
        method: "HEAD",
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    checks['network'] = {
      ok: response.ok,
      durationMs: Date.now() - netStart,
    };
  } catch (err) {
    checks['network'] = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  return {
    healthy: Object.values(checks).every((c) => c.ok),
    checks,
    timestamp: Date.now(),
  };
}

// ============================================
// LOGGING HELPERS
// ============================================

function logMetric(metric: PerformanceMetric): void {
  if (__DEV__) {
    const emoji = (metric.durationMs ?? 0) > 3000 ? "🐢" : "⚡";
    console.log(
      `[Monitor] ${emoji} ${metric.name}: ${metric.durationMs}ms`,
      metric.metadata ? JSON.stringify(metric.metadata) : ""
    );
  }
}

/**
 * Log API call performance.
 */
export function logApiCall(
  method: string,
  url: string,
  status: number,
  durationMs: number
): void {
  const severity = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  logEvent("api_call", severity, { method, url, status, durationMs });
}

/**
 * Log navigation timing.
 */
export function logNavigation(from: string, to: string, durationMs: number): void {
  logEvent("navigation", "info", { from, to, durationMs });
}
