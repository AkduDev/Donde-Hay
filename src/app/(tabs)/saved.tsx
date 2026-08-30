/**
 * Dónde Hay - Saved Tab
 * Pantalla de guardados con tabs: Products, Searches, Sellers
 */

import React, { useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProductCard } from '@/components/product/ProductCard';
import { SavedSearchCard } from '@/components/saved/SavedSearchCard';
import { SavedSellerCard } from '@/components/saved/SavedSellerCard';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import { useFavoriteProducts, useFavoriteSellers, useSavedSearches, useRemoveFavorite, useDeleteSavedSearch, useToggleSearchNotification } from '@/hooks/use-favorites';
import { useAuthStore } from '@/store/authStore';
import type { ProductWithOffers, Seller, SavedSearch } from '@/types';

type TabType = 'products' | 'searches' | 'sellers';
type SavedListItem = ProductWithOffers | SavedSearch | Seller;

export default function SavedScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('products');

  // Queries
  const { data: favoriteProducts, isLoading: loadingProducts, refetch: refetchProducts } = useFavoriteProducts();
  const { data: favoriteSellers, isLoading: loadingSellers, refetch: refetchSellers } = useFavoriteSellers();
  const { data: savedSearches, isLoading: loadingSearches, refetch: refetchSearches } = useSavedSearches();

  // Mutations
  const removeFavorite = useRemoveFavorite();
  const deleteSavedSearch = useDeleteSavedSearch();
  const toggleSearchNotification = useToggleSearchNotification();

  // Refetch based on active tab
  const handleRefresh = () => {
    switch (activeTab) {
      case 'products':
        refetchProducts();
        break;
      case 'searches':
        refetchSearches();
        break;
      case 'sellers':
        refetchSellers();
        break;
    }
  };

  const isLoading = activeTab === 'products' ? loadingProducts :
                    activeTab === 'searches' ? loadingSearches :
                    loadingSellers;

  // Handlers
  const handleProductPress = (product: ProductWithOffers) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  const handleRemoveFavorite = (id: string) => {
    removeFavorite.mutate(id);
  };

  const handleSearchPress = (search: SavedSearch) => {
    router.push({
      pathname: '/results',
      params: { query: typeof search.query === 'string' ? search.query : JSON.stringify(search.query) },
    });
  };

  const handleDeleteSearch = (search: SavedSearch) => {
    deleteSavedSearch.mutate(search.id);
  };

  const handleToggleNotification = (search: SavedSearch, enabled: boolean) => {
    toggleSearchNotification.mutate({ id: search.id, enabled });
  };

  const handleSellerPress = (seller: Seller) => {
    router.push({
      pathname: '/seller/[id]',
      params: { id: seller.id },
    });
  };

  const handleRemoveSeller = (seller: Seller) => {
    handleRemoveFavorite(seller.id);
  };

  // Tabs
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'products', label: 'Productos', icon: '📦' },
    { key: 'searches', label: 'Búsquedas', icon: '🔍' },
    { key: 'sellers', label: 'Vendedores', icon: '👤' },
  ];

  // Empty states
  const renderEmpty = () => (
    <Box flex={1} alignItems="center" justifyContent="center" p="xl">
      <Text variant="displaySmall">
        {activeTab === 'products' ? '📦' : activeTab === 'searches' ? '🔍' : '👤'}
      </Text>
      <Box mt="md" alignItems="center">
        <Text variant="titleMedium" color="text">
          {activeTab === 'products' && 'No tienes productos guardados'}
          {activeTab === 'searches' && 'No tienes búsquedas guardadas'}
          {activeTab === 'sellers' && 'No tienes vendedores guardados'}
        </Text>
      </Box>
      <Box mt="xs" alignItems="center">
        <Text variant="bodyMedium" color="textSecondary" textAlign="center">
          {activeTab === 'products' && 'Guarda productos que te interesen para encontrarlos fácilmente después'}
          {activeTab === 'searches' && 'Guarda búsquedas para recibir notificaciones cuando haya nuevos resultados'}
          {activeTab === 'sellers' && 'Sigue a vendedores para ver sus productos fácilmente'}
        </Text>
      </Box>
      <Box mt="lg">
            <Button
              variant="primary"
              size="md"
              onPress={() => router.push('/')}
              accessibilityLabel={activeTab === 'products' ? 'Explorar productos' : 'Buscar productos'}
            >
          {activeTab === 'products' ? 'Explorar productos' : 'Buscar ahora'}
        </Button>
      </Box>
    </Box>
  );

  // Render product item
  const renderProductItem = ({ item }: { item: ProductWithOffers }) => (
    <Box px="md" mb="sm">
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onFavoritePress={() => handleRemoveFavorite(item.id)}
        isFavorite={true}
        layout="list"
      />
    </Box>
  );

  // Render search item
  const renderSearchItem = ({ item }: { item: SavedSearch }) => (
    <Box px="md" mb="sm">
      <SavedSearchCard
        search={item}
        onPress={handleSearchPress}
        onDelete={handleDeleteSearch}
        onToggleNotification={handleToggleNotification}
      />
    </Box>
  );

  // Render seller item
  const renderSellerItem = ({ item }: { item: Seller }) => (
    <Box px="md" mb="sm">
      <SavedSellerCard
        seller={item}
        onPress={handleSellerPress}
        onRemove={handleRemoveSeller}
      />
    </Box>
  );

  // Get data based on active tab
  const getData = () => {
    switch (activeTab) {
      case 'products':
        return favoriteProducts || [];
      case 'searches':
        return savedSearches || [];
      case 'sellers':
        return favoriteSellers || [];
      default:
        return [];
    }
  };

  const renderItem = ({ item }: { item: SavedListItem }) => {
    switch (activeTab) {
      case 'products':
        return renderProductItem({ item: item as ProductWithOffers });
      case 'searches':
        return renderSearchItem({ item: item as SavedSearch });
      case 'sellers':
        return renderSellerItem({ item: item as Seller });
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box flex={1} bg="background" mode={resolvedMode} alignItems="center" justifyContent="center" p="xl">
          <Text variant="headlineSmall" color="text" textAlign="center">
            Inicia sesión para ver tus guardados
          </Text>
          <Box mt="sm">
            <Text variant="bodyMedium" color="textSecondary" textAlign="center">
              Guarda productos, búsquedas y vendedores para acceder rápido
            </Text>
          </Box>
          <Box mt="lg">
            <Button
              variant="primary"
              size="md"
              onPress={() => router.push('/(auth)/login')}
              accessibilityLabel="Iniciar sesión para ver guardados"
            >
              Iniciar sesión
            </Button>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          <Text variant="titleLarge" color="text">
            ❤️ Guardados
          </Text>
        </Box>

        {/* Tabs */}
        <Box
          flexDirection="row"
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderBottomWidth: activeTab === tab.key ? 2 : 0,
                borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
              }}
            >
              <Text
                variant="labelMedium"
                color={activeTab === tab.key ? 'primary' : 'textSecondary'}
              >
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Box>

        {/* Content */}
        {isLoading ? (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Spinner size="lg" mode={resolvedMode} />
          </Box>
        ) : (
          <FlatList
            data={getData()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 16,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </Box>
    </SafeAreaView>
  );
}
