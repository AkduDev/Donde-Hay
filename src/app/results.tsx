/**
 * Dónde Hay - Search Results Screen
 * Pantalla de resultados de búsqueda con filtros
 */

import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { useThemeStore } from '@/store/themeStore';
import { useSearch } from '@/hooks/use-search';
import { getColors } from '@/theme/colors';
import type { ProductWithOffers, SearchQuery } from '@/types';

const SOURCES = [
  { id: 'all', name: 'Todas', icon: '🌐' },
  { id: 'revolico', name: 'Revolico', icon: '📱' },
  { id: 'facebook', name: 'Facebook', icon: '👤' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: '1cuba', name: '1Cuba', icon: '🇨🇺' },
  { id: 'choleslibres', name: 'CholesLibres', icon: '🏷️' },
];

const SORT_OPTIONS: { id: SearchQuery['sortBy']; name: string }[] = [
  { id: 'recent', name: 'Relevancia' },
  { id: 'price-asc', name: 'Precio: menor a mayor' },
  { id: 'price-desc', name: 'Precio: mayor a menor' },
];

export default function SearchResultsScreen() {
  const router = useRouter();
  const { query, category } = useLocalSearchParams<{ query?: string; category?: string }>();
  const { resolvedMode } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState(query || '');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<SearchQuery['sortBy']>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading, refetch } = useSearch({
    query: searchQuery,
    sourceIds: selectedSource === 'all' ? undefined : [selectedSource],
    sortBy,
    categoryId: category,
  });

  const handleSearch = () => {
    refetch();
  };

  const handleProductPress = (product: ProductWithOffers) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  const renderHeader = () => (
    <Box p="md" gap="md">
      {/* Search Bar */}
      <Box flexDirection="row" alignItems="center" gap="xs">
        <Box flex={1}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Buscar productos..."
            returnKeyType="search"
            mode={resolvedMode}
          />
        </Box>
        <Button
          variant="primary"
          size="md"
          onPress={handleSearch}
          mode={resolvedMode}
        >
          🔍
        </Button>
      </Box>

      {/* Filters Toggle */}
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text variant="bodySmall" color="textSecondary">
          {results?.products?.length || 0} resultados encontrados
        </Text>
        <Box flexDirection="row" alignItems="center" gap="md">
          <Pressable
            onPress={() => router.push('/map' as any)}
            accessibilityLabel="Ver productos en el mapa"
            accessibilityRole="button"
          >
            <Box flexDirection="row" alignItems="center" gap="xxs">
              <Text variant="bodySmall" color="primary">
                🗺️ Mapa
              </Text>
            </Box>
          </Pressable>
          <Pressable onPress={() => setShowFilters(!showFilters)}>
            <Box flexDirection="row" alignItems="center" gap="xxs">
              <Text variant="bodySmall" color="primary">
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Text>
              <Text variant="bodySmall" color="primary">
                {showFilters ? '▲' : '▼'}
              </Text>
            </Box>
          </Pressable>
        </Box>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Box gap="md">
          {/* Sources */}
          <Box>
            <Box mb="xs">
              <Text variant="labelMedium" color="text">
                Fuente
              </Text>
            </Box>
            <Box flexDirection="row" flexWrap="wrap" gap="xs">
              {SOURCES.map((source) => (
                <Pressable
                  key={source.id}
                  onPress={() => setSelectedSource(source.id)}
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    gap="xxs"
                    px="sm"
                    py="xs"
                    borderRadius="md"
                    bg={selectedSource === source.id ? 'primary' : 'surfaceVariant'}
                    mode={resolvedMode}
                  >
                    <Text variant="bodySmall">
                      {source.icon}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color={selectedSource === source.id ? 'onPrimary' : 'text'}
                    >
                      {source.name}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </Box>
          </Box>

          {/* Sort */}
          <Box>
            <Box mb="xs">
              <Text variant="labelMedium" color="text">
                Ordenar por
              </Text>
            </Box>
            <Box flexDirection="row" flexWrap="wrap" gap="xs">
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setSortBy(option.id)}
                >
                  <Box
                    px="sm"
                    py="xs"
                    borderRadius="md"
                    bg={sortBy === option.id ? 'primary' : 'surfaceVariant'}
                    mode={resolvedMode}
                  >
                    <Text
                      variant="bodySmall"
                      color={sortBy === option.id ? 'onPrimary' : 'text'}
                    >
                      {option.name}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderProduct = ({ item }: { item: ProductWithOffers }) => (
    <Box px="md" mb="sm">
      <ProductCard
        product={item}
        onPress={handleProductPress}
        layout="list"
      />
    </Box>
  );

  const renderEmpty = () => (
    <Box flex={1} alignItems="center" justifyContent="center" p="xl">
      <Text variant="headlineMedium">🔍</Text>
      <Box mt="md">
        <Text variant="titleMedium" color="text">
          No se encontraron resultados
        </Text>
      </Box>
      <Box mt="xs">
        <Text variant="bodyMedium" color="textSecondary">
          Intenta con otros términos de búsqueda
        </Text>
      </Box>
    </Box>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          px="md"
          py="sm"
          mode={resolvedMode}
          style={{ borderBottomWidth: 1, borderBottomColor: getColors(resolvedMode).divider }}
        >
          <Pressable onPress={() => router.back()}>
            <Text variant="bodyLarge" color="primary">
              ←
            </Text>
          </Pressable>
          <Box flex={1} alignItems="center">
            <Text variant="titleMedium" color="text">
              Resultados
            </Text>
          </Box>
          <Box width={24} />
        </Box>

        {/* Content */}
        {isLoading ? (
          <Box flex={1} p="md" mode={resolvedMode}>
            <ProductCardSkeleton layout="list" count={6} testID="results-skeleton" />
          </Box>
        ) : (
          <FlashList
            data={results?.products || []}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </SafeAreaView>
  );
}
