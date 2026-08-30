/**
 * Dónde Hay - Home Screen
 * Pantalla principal con búsqueda, categorías y productos destacados
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { SearchBar } from '@/components/search/SearchBar';
import { FEATURES } from '@/config';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';
import { useTrendingSearches } from '@/hooks/use-search';
import type { ProductWithOffers } from '@/types';
import { OpacityTokens } from '@/theme/colors';

const LOGO = require('../../../assets/images/DondeHay3.jpeg');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { resolvedMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productsResponse, isLoading, refetch } = useProducts({});
  const { data: categories = [] } = useCategories();
  const { data: trendingSearches = [] } = useTrendingSearches(6);
  const { data: favoritesData } = useFavorites('product');
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteProductIds = new Set(
    (favoritesData as any[] | undefined)?.map((f: any) => f.targetId) ?? []
  );

  const handleFavoritePress = (product: ProductWithOffers) => {
    if (!user) {
      router.push('/(auth)/login' as any);
      return;
    }
    if (favoriteProductIds.has(product.id)) {
      const fav = (favoritesData as any[])?.find((f: any) => f.targetId === product.id);
      if (fav) removeFavorite.mutate(fav.id);
    } else {
      addFavorite.mutate({ type: 'product', targetId: product.id });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    router.push({
      pathname: '/results' as any,
      params: { query },
    });
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/results' as any,
      params: { category: categoryId },
    });
  };

  const handleProductPress = (product: ProductWithOffers) => {
    router.push({
      pathname: '/product/[id]' as any,
      params: { id: product.id },
    });
  };

  const renderSectionHeader = (title: string, icon: string, onSeeAll?: () => void) => (
    <Box flexDirection="row" justifyContent="space-between" alignItems="center" mb="sm">
      <Box flexDirection="row" alignItems="center" gap="xs">
        <Text variant="titleMedium" color="text">
          {icon} {title}
        </Text>
      </Box>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          accessibilityLabel={`Ver todas las ${title}`}
          accessibilityRole="button"
        >
          <Text variant="bodySmall" color="primary">
            Ver todo →
          </Text>
        </Pressable>
      )}
    </Box>
  );

  const displayProducts =
    productsResponse?.data ?? (FEATURES.useMocks ? MOCK_PRODUCTS : []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            px="md"
            py="sm"
            mode={resolvedMode}
          >
            <Box flexDirection="row" alignItems="center" gap="sm">
              <Image
                source={LOGO}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                resizeMode="cover"
              />
              <Box>
                <Text variant="titleMedium" color="text">
                  Hola {user?.name?.split(' ')[0] || 'Usuario'} 👋
                </Text>
                <Text variant="bodySmall" color="textSecondary">
                  ¿Qué estás buscando hoy?
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Search Bar - protagonista */}
          <Box px="md" mb="sm" mode={resolvedMode}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="Encuentra lo que buscas hoy..."
              accessibilityLabel="Buscar productos"
              size="lg"
              autoFocus={false}
            />
          </Box>

          {/* Trending Searches - búsquedas rápidas */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            <Box flexDirection="row" alignItems="center" gap="xxs" mb="xs">
              <Text variant="labelMedium" color="textSecondary" mode={resolvedMode}>
                🔥 Buscan ahora
              </Text>
            </Box>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Box flexDirection="row" gap="xs" pr="md">
                {trendingSearches.map((search, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSearch(search)}
                    style={({ pressed }) => ({ opacity: pressed ? OpacityTokens.pressed : 1 })}
                    accessibilityLabel={`Buscar: ${search}`}
                    accessibilityRole="button"
                  >
                    <Box
                      px="sm"
                      py="xs"
                      borderRadius="full"
                      borderWidth={1}
                      borderColor="border"
                      mode={resolvedMode}
                    >
                      <Text variant="bodySmall" color="text" mode={resolvedMode}>
                        {search}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </ScrollView>
          </Box>

          {/* Categories - chips compactos */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader('Categorías', '📂')}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Box flexDirection="row" gap="xs" pr="md">
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategoryPress(category.slug)}
                    style={({ pressed }) => ({ opacity: pressed ? OpacityTokens.pressed : 1 })}
                    accessibilityLabel={`Categoría ${category.name}`}
                    accessibilityRole="button"
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap="xxs"
                      px="sm"
                      py="xs"
                      bg="surfaceVariant"
                      borderRadius="full"
                      mode={resolvedMode}
                    >
                      <Text variant="bodyMedium" mode={resolvedMode}>
                        {category.icon}
                      </Text>
                      <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                        {category.name}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </ScrollView>
          </Box>

          {/* Featured Products */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader(
              'Productos Destacados',
              '⭐',
              () => handleSearch('')
            )}
            {isLoading ? (
              <ProductCardSkeleton layout="list" count={3} testID="home-featured-skeleton" />
            ) : displayProducts.length > 0 ? (
              <Box gap="sm">
                {displayProducts.slice(0, 5).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={handleProductPress}
                    onFavoritePress={handleFavoritePress}
                    isFavorite={favoriteProductIds.has(product.id)}
                    layout="list"
                  />
                ))}
              </Box>
            ) : (
              <Card variant="outlined" padding="lg" mode={resolvedMode}>
                <Box alignItems="center">
                  <Text variant="headlineMedium">📦</Text>
                  <Box mt="sm">
                    <Text variant="bodyMedium" color="textSecondary">
                      No hay productos destacados aún
                    </Text>
                  </Box>
                </Box>
              </Card>
            )}
          </Box>

          {/* Tech Products */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader(
              'Tecnología',
              '📱',
              () => handleCategoryPress('electronics')
            )}
            {isLoading ? (
              <Box flexDirection="row" gap="sm" mode={resolvedMode}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} width={160}>
                    <ProductCardSkeleton layout="grid" count={1} testID={`home-tech-skeleton-${i}`} />
                  </Box>
                ))}
              </Box>
            ) : (
              <FlashList
                data={displayProducts.filter((p: ProductWithOffers) => p.categoryId === 'electronics').slice(0, 6)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: ProductWithOffers) => item.id}
                renderItem={({ item }: { item: ProductWithOffers }) => (
                  <Box width={160} mr="sm">
                    <ProductCard
                      product={item}
                      onPress={handleProductPress}
                      onFavoritePress={handleFavoritePress}
                      isFavorite={favoriteProductIds.has(item.id)}
                      layout="grid"
                    />
                  </Box>
                )}
              />
            )}
          </Box>

          {/* Vehicle Products */}
          <Box px="md" mb="xl" mode={resolvedMode}>
            {renderSectionHeader(
              'Vehículos',
              '🚗',
              () => handleCategoryPress('vehicles')
            )}
            {isLoading ? (
              <Box flexDirection="row" gap="sm" mode={resolvedMode}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} width={160}>
                    <ProductCardSkeleton layout="grid" count={1} testID={`home-vehicles-skeleton-${i}`} />
                  </Box>
                ))}
              </Box>
            ) : (
              <FlashList
                data={displayProducts.filter((p: ProductWithOffers) => p.categoryId === 'vehicles').slice(0, 6)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: ProductWithOffers) => item.id}
                renderItem={({ item }: { item: ProductWithOffers }) => (
                  <Box width={160} mr="sm">
                    <ProductCard
                      product={item}
                      onPress={handleProductPress}
                      onFavoritePress={handleFavoritePress}
                      isFavorite={favoriteProductIds.has(item.id)}
                      layout="grid"
                    />
                  </Box>
                )}
              />
            )}
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
