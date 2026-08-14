/**
 * Dónde Hay - Services Barrel Export
 */

export { authService } from './auth.service';
export { productsService } from './products.service';
export { searchService } from './search.service';
export { categoriesService } from './categories.service';
export { favoritesService } from './favorites.service';
export { alertsService } from './alerts.service';
export { locationsService } from './locations.service';
export { profileService } from './profile.service';
export { sellersService } from './sellers.service';

// Re-export types
export type { AuthResponse, LoginRequest, RegisterRequest } from './auth.service';
export type { ProductListParams, TrendingProduct, PriceHistory } from './products.service';
export type { SearchParams, Suggestion, SearchFacets } from './search.service';
export type { Category, CategoryProductsParams } from './categories.service';
export type { CreateAlertRequest, UpdateAlertRequest } from './alerts.service';
export type { Province, Municipality } from './locations.service';
export type { UpdateProfileRequest, UpdatePreferencesRequest, UserStats } from './profile.service';
export type { SellerWithProducts, SellerProductsParams } from './sellers.service';
