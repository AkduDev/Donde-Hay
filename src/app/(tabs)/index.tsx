/**
 * Dónde Hay - Home Screen
 * Pantalla principal con búsqueda, categorías y productos destacados
 */

import React, { useState } from 'react';
import { ScrollView, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ProductCard } from '@/components/product/ProductCard';
import { SearchBar } from '@/components/search/SearchBar';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';
import { useTrendingSearches } from '@/hooks/use-search';
import type { ProductWithOffers } from '@/types';

const MOCK_PRODUCTS: ProductWithOffers[] = [
  {
    id: '1',
    canonicalName: 'iPhone 13',
    brand: 'Apple',
    model: '13',
    categoryId: 'electronics',
    imageUrls: ['https://example.com/iphone13.jpg'],
    offers: [
      { id: 'o1', productId: '1', sellerId: 's1', sourceId: 'revolico', price: 450, currency: 'USD', postedAt: new Date().toISOString(), sourceUrl: 'https://revolico.com/1', locationId: 'habana', status: 'active' },
      { id: 'o2', productId: '1', sellerId: 's2', sourceId: 'instagram', price: 480, currency: 'USD', postedAt: new Date().toISOString(), sourceUrl: 'https://instagram.com/1', locationId: 'santiago', status: 'active' },
    ],
    offerCount: 2,
    availability: { available: true, lastSeen: new Date().toISOString(), status: 'recent' },
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    canonicalName: 'Laptop HP',
    brand: 'HP',
    model: 'Pavilion',
    categoryId: 'computing',
    imageUrls: ['https://example.com/hp-laptop.jpg'],
    offers: [
      { id: 'o3', productId: '2', sellerId: 's3', sourceId: 'revolico', price: 350, currency: 'USD', postedAt: new Date().toISOString(), sourceUrl: 'https://revolico.com/2', locationId: 'habana', status: 'active' },
    ],
    offerCount: 1,
    availability: { available: true, lastSeen: new Date().toISOString(), status: 'recent' },
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    canonicalName: 'PS5',
    brand: 'Sony',
    model: 'PlayStation 5',
    categoryId: 'gaming',
    imageUrls: ['https://example.com/ps5.jpg'],
    offers: [
      { id: 'o4', productId: '3', sellerId: 's4', sourceId: '1cuba', price: 500, currency: 'USD', postedAt: new Date().toISOString(), sourceUrl: 'https://1cuba.cu/1', locationId: 'habana', status: 'active' },
      { id: 'o5', productId: '3', sellerId: 's5', sourceId: 'choleslibres', price: 520, currency: 'USD', postedAt: new Date().toISOString(), sourceUrl: 'https://choleslibres.com/1', locationId: 'santiago', status: 'active' },
    ],
    offerCount: 2,
    availability: { available: true, lastSeen: new Date().toISOString(), status: 'recent' },
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
      pathname: '/search' as any,
      params: { query },
    });
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/search' as any,
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

  const displayProducts = productsResponse?.data ?? MOCK_PRODUCTS;

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
              <Avatar
                size="md"
                name={user?.name || 'Usuario'}
                source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
                mode={resolvedMode}
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

          {/* Search Bar */}
          <Box px="md" mb="md" mode={resolvedMode}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
              placeholder="iPhone 13, laptop, TV..."
              accessibilityLabel="Buscar productos"
            />
          </Box>

          {/* Categories */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader('Categorías', '📂')}
            <Box flexDirection="row" flexWrap="wrap" gap="sm">
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category.slug)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  accessibilityLabel={`Categoría ${category.name}`}
                  accessibilityRole="button"
                >
                  <Box
                    width="23%"
                    alignItems="center"
                    justifyContent="center"
                    p="sm"
                    bg="surfaceVariant"
                    borderRadius="md"
                    mode={resolvedMode}
                  >
                    <Text variant="headlineSmall">
                      {category.icon}
                    </Text>
                    <Box mt="xxs" alignItems="center">
                      <Text variant="bodySmall" color="textSecondary" textAlign="center">
                        {category.name}
                      </Text>
                    </Box>
                  </Box>
                </Pressable>
              ))}
            </Box>
          </Box>

          {/* Trending Searches */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader('Tendencias', '🔥')}
            <Box flexDirection="row" flexWrap="wrap" gap="xs">
              {trendingSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onPress={() => handleSearch(search)}
                  mode={resolvedMode}
                  accessibilityLabel={`Buscar: ${search}`}
                >
                  {search}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Featured Products */}
          <Box px="md" mb="lg" mode={resolvedMode}>
            {renderSectionHeader(
              'Productos Destacados',
              '⭐',
              () => handleSearch('')
            )}
            {isLoading ? (
              <Box alignItems="center" py="lg">
                <Spinner size="md" mode={resolvedMode} />
              </Box>
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
              <Box alignItems="center" py="lg">
                <Spinner size="md" mode={resolvedMode} />
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
              <Box alignItems="center" py="lg">
                <Spinner size="md" mode={resolvedMode} />
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
