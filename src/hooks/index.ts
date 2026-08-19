/**
 * Dónde Hay - Hooks Barrel Export
 */

export { useUser, useLogin, useRegister, useLogout, useForgotPassword, useResetPassword, useChangePassword } from './use-auth';
export { useProducts, useInfiniteProducts, useProduct, useProductOffers, usePriceHistory, useTrending, useNearbyProducts, useRelatedProducts, useReportProduct } from './use-products';
export { useSearch, useInfiniteSearch, useSuggestions, useSearchFacets, useTrendingSearches } from './use-search';
export { useCategories, useCategory, useCategoryProducts } from './use-categories';
export { useFavorites, useFavoriteProducts, useFavoriteSellers, useSavedSearches, useIsFavorite, useAddFavorite, useRemoveFavorite, useToggleFavorite, useSaveSearch, useDeleteSavedSearch, useToggleSearchNotification } from './use-favorites';
export { useAlerts, useAlertMatches, useCreateAlert, useUpdateAlert, useDeleteAlert, useToggleAlert } from './use-alerts';
export { useProvinces, useMunicipalities, useLocation, useReverseGeocode } from './use-locations';
export { useDeviceLocation } from './use-device-location';
export { useNotifications } from './use-notifications';
export { useProfile, useProfileStats, useSearchHistory, useUpdateProfile, useUpdatePreferences, useClearHistory, useDeleteHistoryItem, useUploadAvatar, useDeleteAccount } from './use-profile';
export { useSeller, useSellerProducts, useSellerReviews } from './use-sellers';
export { useDebounce, useDebouncedCallback } from './use-debounce';
export { useAuthGuard, useInitialRoute } from './use-auth-guard';

// Re-export existing hooks
export { useColorScheme } from './use-color-scheme';
export { useTheme, useThemeMode } from './use-theme';
