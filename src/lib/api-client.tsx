/**
 * Dónde Hay - API Client
 * Configuración de TanStack Query y cliente HTTP
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@/config';
import { useToastStore } from '@/store/toastStore';

// ============================================
// CONFIGURACIÓN BASE
// ============================================

export const API_BASE_URL = API_CONFIG.baseUrl;
export const WS_BASE_URL = API_CONFIG.wsUrl;
export const DEFAULT_TIMEOUT = API_CONFIG.timeout;

// ============================================
// STORAGE ADAPTER PARA SECURESTORE
// ============================================

const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently fail on web
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silently fail on web
    }
  },
};

// ============================================
// TIPOS
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig extends RequestInit {
  params?: Record<string, unknown>;
  timeout?: number;
  skipAuth?: boolean;
}

// ============================================
// HTTP CLIENT
// ============================================

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private getToken: () => Promise<string | null>;

  constructor(
    baseUrl: string,
    getToken: () => Promise<string | null> = async () => null
  ) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, timeout = DEFAULT_TIMEOUT, skipAuth = false, headers, body, ...rest } = config;

    const url = this.buildUrl(endpoint, params);
    const token = skipAuth ? null : await this.getToken();

    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...rest,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          code: errorData.code || 'UNKNOWN_ERROR',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.details,
          statusCode: response.status,
        };
        try {
          const showToast = useToastStore.getState().showToast;
          if (response.status >= 500) {
            showToast('Error del servidor. Intenta de nuevo.', 'error');
          } else if (response.status === 401) {
            showToast('Sesión expirada. Inicia sesión de nuevo.', 'warning');
          } else if (response.status === 403) {
            showToast('No tienes permiso para esta acción.', 'error');
          } else if (response.status === 404) {
            showToast('Recurso no encontrado.', 'info');
          } else if (response.status >= 400) {
            showToast(errorData.message || 'Error en la solicitud.', 'warning');
          }
        } catch { /* toast store may not be initialized */ }
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        try {
          useToastStore.getState().showToast('Tiempo de espera agotado.', 'error');
        } catch { /* toast store may not be initialized */ }
        throw { code: 'TIMEOUT', message: 'Request timeout', statusCode: 408 } as ApiError;
      }
      throw error;
    }
  }

  // Métodos HTTP
  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request('GET', endpoint, config);
  }

  post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request('POST', endpoint, { ...config, body: body as string | undefined });
  }

  put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request('PUT', endpoint, { ...config, body: body as string | undefined });
  }

  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request('PATCH', endpoint, { ...config, body: body as string | undefined });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request('DELETE', endpoint, config);
  }
}

// ============================================
// INSTANCIA GLOBAL
// ============================================

let authTokenGetter: () => Promise<string | null> = async () => null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  authTokenGetter = getter;
}

export const httpClient = new HttpClient(API_BASE_URL, async () => authTokenGetter());

// ============================================
// TANSTACK QUERY CLIENT
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos (cache time)
      retry: (failureCount: number, error: Error) => {
        // No reintentar en errores 4xx
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as unknown as ApiError).statusCode;
          if (statusCode >= 400 && statusCode < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ============================================
// PROVIDER WRAPPER
// ============================================

interface QueryProviderProps {
  children: ReactNode;
  client?: QueryClient;
}

export function QueryProvider({ children, client = queryClient }: QueryProviderProps) {
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================
// HOOKS DE AUTENTICACIÓN
// ============================================

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

export async function getStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    secureStoreAdapter.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    secureStoreAdapter.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
  ]);
  return { accessToken, refreshToken };
}

export async function storeTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    secureStoreAdapter.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken),
    secureStoreAdapter.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    secureStoreAdapter.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    secureStoreAdapter.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
    secureStoreAdapter.removeItem(AUTH_STORAGE_KEYS.USER),
  ]);
}

// ============================================
// QUERY KEYS FACTORY
// ============================================

export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // Products
  products: {
    list: (params?: object) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    offers: (productId: string) => ['products', 'offers', productId] as const,
    priceHistory: (productId: string) => ['products', 'price-history', productId] as const,
    trending: () => ['products', 'trending'] as const,
    nearby: (params?: object) => ['products', 'nearby', params] as const,
  },

  // Search
  search: {
    results: (query: string, params?: object) =>
      ['search', 'results', query, params] as const,
    suggestions: (query: string) => ['search', 'suggestions', query] as const,
    facets: (query?: string) => ['search', 'facets', query] as const,
  },

  // Categories
  categories: {
    list: () => ['categories', 'list'] as const,
    detail: (slug: string) => ['categories', 'detail', slug] as const,
    products: (slug: string, params?: object) =>
      ['categories', 'products', slug, params] as const,
  },

  // Favorites
  favorites: {
    list: (type?: string) =>
      ['favorites', 'list', type] as const,
  },

  // Alerts
  alerts: {
    list: () => ['alerts', 'list'] as const,
  },

  // Locations
  locations: {
    provinces: () => ['locations', 'provinces'] as const,
    municipalities: (provinceId: string) => ['locations', 'municipalities', provinceId] as const,
  },

  // Profile
  profile: {
    me: () => ['profile', 'me'] as const,
    history: () => ['profile', 'history'] as const,
  },
} as const;