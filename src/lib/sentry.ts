/**
 * Dónde Hay - Sentry wrapper
 * Crash reporting real con @sentry/react-native.
 * Se activa solo si EXPO_PUBLIC_SENTRY_DSN está definido y el módulo nativo
 * está linkado en el build. En Expo Go / APK sin rebuild es un no-op seguro:
 * los require y las capturas están envueltos en try/catch para nunca romper la app.
 */

import { SENTRY_CONFIG, APP_CONFIG, FEATURES } from '@/config';

interface SentryBreadcrumb {
  message?: string;
  level?: 'log' | 'info' | 'warning' | 'error';
  category?: string;
  data?: Record<string, unknown>;
}

interface SentrySdk {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: 'log' | 'info' | 'warning' | 'error') => void;
  addBreadcrumb: (breadcrumb: SentryBreadcrumb) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  setTag: (key: string, value: string) => void;
}

let sdk: SentrySdk | null = null;
let initTried = false;

function getSdk(): SentrySdk | null {
  if (initTried) return sdk;
  initTried = true;

  if (!FEATURES.crashReporting) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import dinámico: módulo nativo opcional (APK sin rebuild)
    const mod = require('@sentry/react-native') as SentrySdk;
    if (!mod || typeof mod.init !== 'function') return null;

    mod.init({
      dsn: SENTRY_CONFIG.dsn,
      environment: APP_CONFIG.isProduction ? 'production' : 'development',
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      attachStacktrace: true,
      enableAutoSessionTracking: true,
    });

    sdk = mod as SentrySdk;
  } catch {
    sdk = null;
  }

  return sdk;
}

export const sentry = {
  isInitialized: (): boolean => getSdk() !== null,

  captureException(error: unknown, context?: Record<string, unknown>): void {
    const s = getSdk();
    if (!s) return;
    try {
      s.captureException(error, context);
    } catch {
      // El monitor jamás debe romper la app
    }
  },

  captureMessage(message: string, level: 'log' | 'info' | 'warning' | 'error' = 'info'): void {
    const s = getSdk();
    if (!s) return;
    try {
      s.captureMessage(message, level);
    } catch {
      // no-op
    }
  },

  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    const s = getSdk();
    if (!s) return;
    try {
      s.addBreadcrumb(breadcrumb);
    } catch {
      // no-op
    }
  },

  setUser(user: Record<string, unknown> | null): void {
    const s = getSdk();
    if (!s) return;
    try {
      s.setUser(user);
    } catch {
      // no-op
    }
  },

  setTag(key: string, value: string): void {
    const s = getSdk();
    if (!s) return;
    try {
      s.setTag(key, value);
    } catch {
      // no-op
    }
  },
};