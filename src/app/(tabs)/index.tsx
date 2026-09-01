/**
 * Dónde Hay - Home Screen
 * Jerarquía reducida: ¿Qué estás buscando? → Buscar → Tendencias → Cerca de ti → Últimos descubrimientos
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, RefreshControl, Image } from 'react-native';
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
import { useLocationStore } from '@/store/locationStore';
import { useProducts, useNearbyProducts } from '@/hooks/use-products';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';
import { useTrendingSearches } from '@/hooks/use-search';
import type { Favorite, ProductWithOffers } from '@/types';
import { OpacityTokens } from '@/theme/colors';

const LOGO = require('../../../assets/images/DondeHay3.jpeg');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { resolvedMode } = useThemeStore();
  const { userLocation } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productsResponse, isLoading, refetch } = useProducts({});
  const { data: trendingSearches = [] } = useTrendingSearches(6);
  const { data: nearbyProducts, isLoading: nearbyLoading } = useNearbyProducts(
    userLocation?.latitude ?? 0,
    userLocation?.longitude ?? 0
  );
  const { data: favoritesData } = useFavorites('product');
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteProductIds = new Set(
    (favoritesData as Favorite[] | undefined)?.map((f) => f.targetId) ?? []
  );

  const handleFavoritePress = (product: ProductWithOffers) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (favoriteProductIds.has(product.id)) {
      const fav = (favoritesData as Favorite[])?.find((f) => f.targetId === product.id);
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
      pathname: '/results',
      params: { query },
    });
  };

  const handleProductPress = (product: ProductWithOffers) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <Box flexDirection="row" justifyContent="space-between" alignItems="center" mb="sm">
      <Text variant="titleMedium" color="text">
        {title}
      </Text>
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

  const latestProducts = displayProducts.slice(0, 5);
  const nearbyList = nearbyProducts ?? [];

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
                  Dónde Hay
                </Text>
                <Text variant="bodySmall" color="textSecondary">
                  {user ? `Hola, ${user.name?.split(' ')[0]}` : '¿Qué estás buscando hoy?'}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Search - protagonista */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="¿Qué quieres encontrar?"
              accessibilityLabel="Buscar productos"
              size="lg"
              autoFocus={false}
            />
          </Box>

          {/* Tendencias */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader('Tendencias')}
            {trendingSearches.length > 0 ? (
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
            ) : (
              <Text variant="bodySmall" color="textSecondary">
                Sin tendencias por ahora.
              </Text>
            )}
          </Box>

          {/* Cerca de ti */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader('Cerca de ti', () => router.push('/map'))}
            {!userLocation ? (
              <Card variant="outlined" padding="md" mode={resolvedMode}>
                <Pressable
                  onPress={() => router.push('/map')}
                  accessibilityLabel="Activar ubicación para ver ofertas cerca"
                  accessibilityRole="button"
                >
                  <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Box flex={1} mr="sm">
                      <Text variant="bodyMedium" color="text">
                        📍 Activa tu ubicación
                      </Text>
                      <Text variant="bodySmall" color="textSecondary">
                        Para ver ofertas cerca de ti.
                      </Text>
                    </Box>
                    <Text variant="bodySmall" color="primary">
                      Abrir mapa →
                    </Text>
                  </Box>
                </Pressable>
              </Card>
            ) : nearbyLoading ? (
              <Box flexDirection="row" gap="sm" mode={resolvedMode}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} width={160}>
                    <ProductCardSkeleton layout="grid" count={1} testID={`home-nearby-skeleton-${i}`} />
                  </Box>
                ))}
              </Box>
            ) : nearbyList.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Box flexDirection="row" gap="sm" pr="md" mode={resolvedMode}>
                  {nearbyList.slice(0, 6).map((product) => (
                    <Box key={product.id} width={160}>
                      <ProductCard
                        product={product}
                        onPress={handleProductPress}
                        onFavoritePress={handleFavoritePress}
                        isFavorite={favoriteProductIds.has(product.id)}
                        layout="grid"
                      />
                    </Box>
                  ))}
                </Box>
              </ScrollView>
            ) : (
              <Text variant="bodySmall" color="textSecondary">
                Nada cerca todavía — mira los últimos descubrimientos.
              </Text>
            )}
          </Box>

          {/* Últimos descubrimientos */}
          <Box px="md" mb="xl" mode={resolvedMode}>
            {renderSectionHeader('Últimos descubrimientos', () => handleSearch(''))}
            {isLoading ? (
              <ProductCardSkeleton layout="list" count={3} testID="home-latest-skeleton" />
            ) : latestProducts.length > 0 ? (
              <Box gap="sm">
                {latestProducts.map((product) => (
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
                      No hay productos aún
                    </Text>
                  </Box>
                </Box>
              </Card>
            )}
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}