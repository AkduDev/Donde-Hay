/**
 * Dónde Hay - Global TypeScript Types
 * Tipos globales utilizados en toda la aplicación
 */

// ============================================
// PRODUCTOS
// ============================================

export interface Product {
  id: string;
  canonicalName: string;
  brand: string;
  model: string;
  categoryId: string;
  description?: string;
  specifications?: Record<string, string>;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductOffer {
  id: string;
  productId: string;
  sellerId: string;
  sourceId: string;
  price: number;
  currency: 'USD' | 'CUP' | 'MLC';
  locationId: string;
  sourceUrl: string;
  sourceExternalId?: string;
  postedAt: string;
  status: 'active' | 'inactive' | 'sold';
  rawData?: Record<string, unknown>;
}

export interface Seller {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  sourceId: string;
  sourceProfileUrl?: string;
  rating?: number;
  verificationStatus: 'none' | 'pending' | 'verified';
  locationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  baseUrl?: string;
  logoUrl?: string;
  type: 'marketplace' | 'social' | 'partner' | 'community';
  isActive: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BÚSQUEDA
// ============================================

export interface SearchQuery {
  query: string;
  categoryId?: string;
  locationId?: string;
  sourceIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  condition?: 'new' | 'used' | 'any';
  sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'distance';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: ProductWithOffers[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  query: string;
  processingTimeMs: number;
  sources: SourceSummary[];
}

/**
 * Contrato de entrada (Prioridad 5) para el RPC `search_products` / Edge Function
 * `search-products`. Es el input tipado que consume la app y que la backend debe
 * aceptar (PostgREST params o body JSON de la Edge Function).
 */
export interface SearchRequest {
  query: string;
  categoryId?: string;
  locationId?: string;
  sourceIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: 'USD' | 'CUP' | 'MLC';
  condition?: 'new' | 'used' | 'any';
  sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'distance';
  page?: number;
  limit?: number;
}

/**
 * Contrato de salida (Prioridad 5) del RPC `search_products` / Edge Function
 * `search-products`. Alineado con `SearchResult` (productos agrupados por producto,
 * cada uno con su lista de ofertas y agregados) + metadatos de fuentes.
 */
export interface SearchResponse {
  products: ProductWithOffers[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  query: string;
  processingTimeMs: number;
  sources: SourceSummary[];
}

/**
 * Fila de la lista de ofertas de un producto en el DETAIL (Prioridad 5).
 * "Comparar precios (N)": una entrada por oferta, ordenada por precio asc.
 */
export interface OfferListItem {
  offerId: string;
  price: number;
  currency: 'USD' | 'CUP' | 'MLC';
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sellerName?: string;
  postedAt: string;
  status: 'active' | 'inactive' | 'sold';
}

export interface SourceSummary {
  sourceId: string;
  count: number;
}

export interface ScrapedProduct {
  id: string;
  canonicalName: string;
  brand?: string;
  model?: string;
  description?: string;
  imageUrls: string[];
  sourceId: 'revolico';
  sourceExternalId: string;
  sourceUrl: string;
  price: number;
  currency: 'USD' | 'CUP' | 'MLC';
  sellerName?: string;
  sellerPhone?: string;
  sellerWhatsapp?: boolean;
  provinceId?: string;
  municipalityId?: string;
  viewCount?: number;
  postedAt: string;
}

export type SourceFilter = 'all' | 'comunidad' | 'revolico';

export interface MultiSourceSearchResult {
  dbResults: SearchResult;
  scrapedProducts: ScrapedProduct[];
  combinedProducts: ProductWithOffers[];
  total: number;
  sourceCounts: Record<string, number>;
  errors: { source: string; message: string }[];
}

export interface ProductWithOffers extends Product {
  offers: ProductOffer[];
  averagePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  offerCount: number;
  availability: {
    available: boolean;
    lastSeen: string;
    status: 'recent' | 'old' | 'unknown';
  };
  isFavorite?: boolean;
}

/**
 * Agregados de un grupo de ofertas del MISMO producto (matching). Es lo que
 * produce la librería pura de matching y lo que se usa para rellenar
 * minPrice/averagePrice/maxPrice/offerCount/availability en `ProductWithOffers`.
 */
export interface OfferAggregate {
  offerCount: number;
  minPrice?: number;
  maxPrice?: number;
  averagePrice?: number;
  sourceCount: number;
  sources: string[];
  availability: {
    available: boolean;
    lastSeen: string;
    status: 'recent' | 'old' | 'unknown';
  };
}

// ============================================
// USUARIO
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  role: 'user' | 'seller' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface UserPreferences {
  currency: 'USD' | 'CUP' | 'MLC';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    alerts: boolean;
    promotions: boolean;
  };
  searchRadius: number;
  defaultLocation?: string;
  favoriteCategories?: string[];
}

// ============================================
// FAVORITOS & GUARDADOS
// ============================================

export interface Favorite {
  id: string;
  userId: string;
  type: 'product' | 'search' | 'seller';
  targetId: string;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  query: SearchQuery;
  name: string;
  notifyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  currency: 'USD' | 'CUP' | 'MLC';
  direction: 'below' | 'above';
  isActive: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
  product?: Product;
}

// ============================================
// UBICACIÓN
// ============================================

export interface Location {
  id: string;
  name: string;
  type: 'country' | 'province' | 'municipality' | 'neighborhood';
  parentId?: string;
  latitude?: number;
  longitude?: number;
  provinceCode?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HISTORIAL
// ============================================

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  filters: Partial<SearchQuery>;
  resultsCount: number;
  createdAt: string;
}

// ============================================
// NAVEGACIÓN
// ============================================

export interface RouteParams {
  index?: undefined;
  search?: { query?: string };
  explore?: { category?: string };
  'product-details': { productId: string };
  'category-products': { categorySlug: string };
  login?: undefined;
  register?: undefined;
  'forgot-password'?: undefined;
  'reset-password'?: { token: string };
  profile?: undefined;
  'profile-edit'?: undefined;
  'profile-preferences'?: undefined;
  saved?: undefined;
  'saved-product'?: { productId: string };
  'saved-search'?: { searchId: string };
  'saved-seller'?: { sellerId: string };
  alerts?: undefined;
  'alert-create'?: undefined;
  'alert-edit'?: { alertId: string };
  'nearby-products'?: { latitude: number; longitude: number };
  publish?: undefined;
  'publish/index'?: undefined;
}

// ============================================
// UTILS
// ============================================

export interface PriceRange {
  min: number;
  max: number;
  currency: 'USD' | 'CUP' | 'MLC';
}

export interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
}
