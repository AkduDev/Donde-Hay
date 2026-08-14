/**
 * Dónde Hay - Home Screen
 * Pantalla principal con búsqueda, categorías y productos destacados
 */

import React, { useState } from 'react';
import { StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import { useQuery } from '@tanstack/react-query';
import { getSourceIcon } from '@/utils/format';

const { width } = Dimensions.get('window');

const TRENDING_SEARCHES = [
  'iPhone 13',
  'Laptop HP',
  'PS5',
  'Toyota Corolla',
  'Samsung Galaxy S23',
  'Nintendo Switch',
];

const CATEGORIES = [
  { id: '1', name: 'Tecnología', icon: '📱' },
  { id: '2', name: 'Computación', icon: '💻' },
  { id: '3', name: 'Vehículos', icon: '🚗' },
  { id: '4', name: 'Hogar', icon: '🏠' },
  { id: '5', name: 'Ropa', icon: '👕' },
  { id: '6', name: 'Videojuegos', icon: '🎮' },
  { id: '7', name: 'Herramientas', icon: '🔧' },
  { id: '8', name: 'Más', icon: '➕' },
];

// TODO: Replace with real API call
const MOCK_PRODUCTS = [
  {
    id: '1',
    canonicalName: 'iPhone 13',
    brand: 'Apple',
    model: '13',
    categoryId: '1',
    imageUrls: ['https://example.com/iphone13.jpg'],
    offers: [
      { id: 'o1', sourceId: 'revolico', price: 450, currency: 'USD' as const },
      { id: 'o2', sourceId: 'instagram', price: 480, currency: 'USD' as const },
    ],
  },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => Promise.resolve(MOCK_PRODUCTS),
  });

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // TODO: Navigate to search screen with query
      console.log('Searching for:', searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <Box flex={1} bg="background" mode={resolvedMode}>
      <Box style={styles.content}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          mb="md"
        >
          <Box flexDirection="row" alignItems="center" gap="sm">
            <Avatar
              size="md"
              name={user?.name || 'Usuario'}
              source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
              mode={resolvedMode}
            />
            <Box>
              <Text variant="titleMedium" color="text" mode={resolvedMode}>
                Hola {user?.name?.split(' ')[0] || 'Usuario'} 👋
              </Text>
              <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                ¿Qué estás buscando hoy?
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box
          flexDirection="row"
          alignItems="center"
          bg="surfaceVariant"
          p="xs"
          borderRadius="md"
          mb="md"
        >
          <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
            🔍
          </Text>
          <Box flex={1} ml="xxs">
            <Input
              placeholder="iPhone 13, laptop, TV..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              autoCapitalize="sentences"
              returnKeyType="search"
              size="sm"
              mode={resolvedMode}
            />
          </Box>
          {searchQuery.trim() !== '' && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                ✕
              </Text>
            </Pressable>
          )}
        </Box>

        {/* Trending Searches */}
        <Box mb="md">
          <Box mb="xxs">
            <Text variant="titleMedium" color="text" mode={resolvedMode}>
              🔥 Tendencias
            </Text>
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap="xxs">
            {TRENDING_SEARCHES.map((search, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onPress={() => {
                  setSearchQuery(search);
                  handleSearchSubmit();
                }}
                mode={resolvedMode}
              >
                {search}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Categories Grid */}
        <Box mb="md">
          <Box mb="xxs">
            <Text variant="titleMedium" color="text" mode={resolvedMode}>
              📂 Categorías
            </Text>
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap="xxs">
            {CATEGORIES.map((category) => (
              <Box
                key={category.id}
                width={(width - 48) / 4}
                alignItems="center"
                justifyContent="center"
              >
                <Card
                  variant="elevated"
                  padding="xxs"
                  mode={resolvedMode}
                  onPress={() => {
                    // TODO: Navigate to category screen
                    console.log('Navigating to category:', category.name);
                  }}
                >
                  <Box alignItems="center" justifyContent="center" gap="xxxs">
                    <Text variant="titleMedium" mode={resolvedMode}>
                      {category.icon}
                    </Text>
                    <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                      {category.name}
                    </Text>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Featured Products */}
        {!isLoading && featuredProducts && (
          <Box>
            <Box mb="xxs">
              <Text variant="titleMedium" color="text" mode={resolvedMode}>
                📦 Productos Destacados
              </Text>
            </Box>
            {featuredProducts.map((product) => (
              <Box key={product.id} mb="sm">
                <Card variant="elevated" padding="sm" mode={resolvedMode}>
                  <Box flexDirection="row" gap="sm">
                    {/* Product Image */}
                    <Box
                      width={80}
                      height={80}
                      borderRadius="md"
                      overflow="hidden"
                      bg="surfaceVariant"
                    >
                      {product.imageUrls?.[0] ? (
                        <Image
                          source={{ uri: product.imageUrls[0] }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Box flex={1} alignItems="center" justifyContent="center">
                          <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                            Imagen
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {/* Product Info */}
                    <Box flex={1}>
                      <Box mb="xxxs">
                        <Text variant="titleSmall" color="text" mode={resolvedMode}>
                          {product.canonicalName}
                        </Text>
                      </Box>
                      <Box mb="xxxs">
                        <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                          {product.brand} {product.model}
                        </Text>
                      </Box>

                      {/* Offers Summary */}
                      {product.offers && product.offers.length > 0 && (
                        <Box mb="xxxs">
                          <Text variant="labelMedium" color="textSecondary" mode={resolvedMode}>
                            {product.offers.length} ofertas desde
                          </Text>
                          <Text variant="titleMedium" color="success" mode={resolvedMode} fontWeight="semiBold">
                            ${Math.min(...product.offers.map((o) => o.price))}
                          </Text>
                        </Box>
                      )}

                      {/* Source Icons */}
                      <Box flexDirection="row" gap="xxxs" mb="xxxs">
                        {product.offers?.map((offer) => (
                          <Text key={offer.id} variant="labelSmall" color="textTertiary" mode={resolvedMode}>
                            {getSourceIcon(offer.sourceId)}
                          </Text>
                        ))}
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          // TODO: Navigate to product detail
                          console.log('Navigating to product detail:', product.id);
                        }}
                        mode={resolvedMode}
                      >
                        Ver detalles
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {isLoading && (
          <Box alignItems="center" justifyContent="center" py="xl">
            <Spinner size="lg" mode={resolvedMode} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    flex: 1,
  },
  clearButton: {
    padding: 8,
  },
});
