/**
 * Dónde Hay - Search Tab
 * Search screen with source filter chips (All / Community / Revolico)
 */

import React, { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Spinner } from '@/components/ui/Spinner';
import { SearchBar, SearchSuggestion } from '@/components/search/SearchBar';
import { SourceChip } from '@/components/product/SourceChip';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/theme/colors';
import { useCategories } from '@/hooks/use-categories';
import { useSavedSearches } from '@/hooks/use-favorites';
import { useMultiSourceSearch } from '@/hooks/use-search';
import type { SourceFilter } from '@/types';

const TRENDING_SEARCHES: SearchSuggestion[] = [
  { id: '1', text: 'iPhone 13', type: 'trending', icon: '🔥' },
  { id: '2', text: 'Laptop HP', type: 'trending', icon: '🔥' },
  { id: '3', text: 'PS5', type: 'trending', icon: '🔥' },
  { id: '4', text: 'Toyota Corolla', type: 'trending', icon: '🔥' },
  { id: '5', text: 'Samsung Galaxy S23', type: 'trending', icon: '🔥' },
  { id: '6', text: 'Nintendo Switch', type: 'trending', icon: '🔥' },
];

const CATEGORY_ICONS: Record<string, string> = {
  tecnologia: '📱',
  computacion: '💻',
  vehiculos: '🚗',
  hogar: '🏠',
  ropa: '👕',
  videojuegos: '🎮',
};

const SOURCE_FILTERS: { key: SourceFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Todos', icon: '🔍' },
  { key: 'comunidad', label: 'Comunidad', icon: '👥' },
  { key: 'revolico', label: 'Revolico', icon: '🛒' },
];

export default function SearchTabScreen() {
  const router = useRouter();
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const { data: categories } = useCategories();
  const { data: savedSearches } = useSavedSearches();

  const { data: multiResult, isLoading: isSearchLoading } = useMultiSourceSearch(
    { query: activeQuery },
    sourceFilter
  );

  const recentSearches: SearchSuggestion[] = (savedSearches ?? []).slice(0, 5).map((s) => ({
    id: s.id,
    text: s.query.query,
    type: 'history' as const,
    icon: '🕐',
  }));

  const categorySuggestions: SearchSuggestion[] = (categories ?? []).map((cat) => ({
    id: cat.id,
    text: cat.name,
    type: 'category' as const,
    icon: CATEGORY_ICONS[cat.slug] ?? '📂',
  }));

  const allSuggestions: SearchSuggestion[] = [
    ...recentSearches,
    ...TRENDING_SEARCHES,
    ...categorySuggestions,
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveQuery(query);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      router.push({
        pathname: '/search',
        params: { category: suggestion.text.toLowerCase() },
      });
    } else {
      handleSearch(suggestion.text);
    }
  };

  const handleSourceFilterChange = (filter: SourceFilter) => {
    setSourceFilter(filter);
  };

  const handleProductPress = (product: { id: string }) => {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };

  const searchResults = multiResult?.combinedProducts ?? [];
  const sourceCounts = multiResult?.sourceCounts ?? {};
  const hasErrors = (multiResult?.errors?.length ?? 0) > 0;
  const isShowingResults = activeQuery.length >= 2;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Box flex={1} bg="background" mode={resolvedMode}>
        {/* Header */}
        <Box px="md" py="sm" mode={resolvedMode}>
          <Box mb="md">
            <Text variant="titleLarge" color="text">
              🔍 Buscar
            </Text>
          </Box>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            onSuggestionPress={handleSuggestionPress}
            suggestions={allSuggestions}
            showSuggestions={!isShowingResults}
            placeholder="Buscar productos..."
            autoFocus
            accessibilityLabel="Buscar productos"
          />
        </Box>

        {/* Source Filter Chips */}
        {isShowingResults && (
          <Box px="md" py="xs" mode={resolvedMode}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Box flexDirection="row" gap="xs">
                {SOURCE_FILTERS.map((filter) => {
                  const isActive = sourceFilter === filter.key;
                  const count = filter.key === 'all'
                    ? multiResult?.total ?? 0
                    : sourceCounts[filter.key] ?? 0;

                  return (
                    <Pressable
                      key={filter.key}
                      onPress={() => handleSourceFilterChange(filter.key)}
                      accessibilityLabel={`Filtrar por ${filter.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        gap="xxs"
                        px="sm"
                        py="xs"
                        borderRadius="md"
                        bg={isActive ? 'primary' : 'surfaceVariant'}
                        mode={resolvedMode}
                      >
                        <Text variant="bodySmall">{filter.icon}</Text>
                        <Text
                          variant="labelMedium"
                          color={isActive ? 'textOnPrimary' : 'text'}
                        >
                          {filter.label}
                        </Text>
                        {count > 0 && (
                          <Box
                            px="xxs"
                            py="xxxs"
                            borderRadius="full"
                            bg={isActive ? 'primaryLight' : 'surfaceContainerHigh'}
                            mode={resolvedMode}
                          >
                            <Text
                              variant="labelSmall"
                              color={isActive ? 'textOnPrimary' : 'textSecondary'}
                            >
                              {count}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Pressable>
                  );
                })}
              </Box>
            </ScrollView>
          </Box>
        )}

        {/* Search Results */}
        {isShowingResults && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Loading State */}
            {isSearchLoading && (
              <Box alignItems="center" py="xl" mode={resolvedMode}>
                <Spinner size="md" mode={resolvedMode} />
                <Box mt="sm">
                  <Text variant="bodySmall" color="textSecondary">
                    Buscando en todas las fuentes...
                  </Text>
                </Box>
              </Box>
            )}

            {/* Error Warning */}
            {hasErrors && !isSearchLoading && (
              <Box px="md" py="xs" mode={resolvedMode}>
                <Box
                  p="sm"
                  borderRadius="md"
                  bg="warningContainer"
                  mode={resolvedMode}
                >
                  <Text variant="labelSmall" color="onWarningContainer">
                    ⚠️ Algunas fuentes no están disponibles. Mostrando resultados parciales.
                  </Text>
                </Box>
              </Box>
            )}

            {/* Results List */}
            {!isSearchLoading && searchResults.length > 0 && (
              <Box px="md" py="sm" mode={resolvedMode}>
                <Box mb="sm">
                  <Text variant="labelMedium" color="textSecondary">
                    {multiResult?.total ?? 0} resultados encontrados
                  </Text>
                </Box>
                <Box gap="sm">
                  {searchResults.map((product) => (
                    <Pressable
                      key={product.id}
                      onPress={() => handleProductPress(product)}
                      accessibilityLabel={`${product.canonicalName}`}
                      accessibilityRole="button"
                    >
                      <Box
                        p="md"
                        bg="surface"
                        borderRadius="md"
                        mode={resolvedMode}
                        style={{ borderWidth: 1, borderColor: colors.border }}
                      >
                        <Box flexDirection="row" gap="md">
                          <Box
                            width={80}
                            height={80}
                            borderRadius="md"
                            overflow="hidden"
                            bg="surfaceVariant"
                            mode={resolvedMode}
                          >
                            {product.imageUrls?.[0] ? (
                              <Image
                                source={{ uri: product.imageUrls[0] }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Box flex={1} alignItems="center" justifyContent="center" mode={resolvedMode}>
                                <Text variant="bodySmall" color="textTertiary">📦</Text>
                              </Box>
                            )}
                          </Box>
                          <Box flex={1} mode={resolvedMode}>
                            <Text
                              variant="titleSmall"
                              color="text"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {product.canonicalName}
                            </Text>
                            <Text variant="bodySmall" color="textSecondary">
                              {product.brand} {product.model}
                            </Text>
                              {product.minPrice != null && (
                                <Box mt="xxs">
                                  <Text variant="titleMedium" color="success" fontWeight="bold">
                                    ${product.minPrice.toLocaleString('es-CU')}
                                  </Text>
                                </Box>
                              )}
                            <Box flexDirection="row" flexWrap="wrap" gap="xxxs" mt="xxs">
                              {Object.entries(sourceCounts).map(([sourceId, count]) => (
                                <SourceChip
                                  key={sourceId}
                                  sourceId={sourceId}
                                  count={count}
                                  size="xs"
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Pressable>
                  ))}
                </Box>
              </Box>
            )}

            {/* Empty State */}
            {!isSearchLoading && searchResults.length === 0 && (
              <Box alignItems="center" py="xl" px="md" mode={resolvedMode}>
                <Text variant="headlineMedium">🔍</Text>
                <Box mt="sm" alignItems="center">
                  <Text variant="titleMedium" color="text">
                    Sin resultados
                  </Text>
                  <Box mt="xs">
                    <Text variant="bodySmall" color="textSecondary" textAlign="center">
                      No se encontraron productos para "{activeQuery}"
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}
          </ScrollView>
        )}

        {/* Default Content (no active search) */}
        {!isShowingResults && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Box px="md" mt="lg" mode={resolvedMode}>
                <Box mb="sm">
                  <Text variant="titleMedium" color="text">
                    🕐 Búsquedas recientes
                  </Text>
                </Box>
                <Box gap="xs">
                  {recentSearches.map((search) => (
                    <Pressable
                      key={search.id}
                      onPress={() => handleSearch(search.text)}
                      accessibilityLabel={`Buscar: ${search.text}`}
                      accessibilityRole="button"
                    >
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        gap="sm"
                        p="sm"
                        bg="surfaceVariant"
                        borderRadius="md"
                        mode={resolvedMode}
                      >
                        <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
                          🕐
                        </Text>
                        <Text variant="bodyMedium" color="text" mode={resolvedMode}>
                          {search.text}
                        </Text>
                      </Box>
                    </Pressable>
                  ))}
                </Box>
              </Box>
            )}

            {/* Trending */}
            <Box px="md" mt="lg" mode={resolvedMode}>
              <Box mb="sm">
                <Text variant="titleMedium" color="text">
                  🔥 Tendencias
                </Text>
              </Box>
              <Box flexDirection="row" flexWrap="wrap" gap="xs">
                {TRENDING_SEARCHES.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSearch(item.text)}
                    accessibilityLabel={`Tendencia: ${item.text}`}
                    accessibilityRole="button"
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap="xxs"
                      px="sm"
                      py="xs"
                      bg="surfaceVariant"
                      borderRadius="md"
                      mode={resolvedMode}
                    >
                      <Text variant="bodySmall" mode={resolvedMode}>
                        {item.icon}
                      </Text>
                      <Text variant="bodySmall" color="text" mode={resolvedMode}>
                        {item.text}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </Box>

            {/* Categories */}
            <Box px="md" mt="lg" mb="xl" mode={resolvedMode}>
              <Box mb="sm">
                <Text variant="titleMedium" color="text">
                  📂 Categorías
                </Text>
              </Box>
              <Box gap="xs">
                {categorySuggestions.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => handleSuggestionPress(category)}
                    accessibilityLabel={`Categoría: ${category.text}`}
                    accessibilityRole="button"
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap="sm"
                      p="sm"
                      bg="surfaceVariant"
                      borderRadius="md"
                      mode={resolvedMode}
                    >
                      <Text variant="bodyLarge" mode={resolvedMode}>
                        {category.icon}
                      </Text>
                      <Text variant="bodyMedium" color="text" mode={resolvedMode}>
                        {category.text}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </Box>
          </ScrollView>
        )}
      </Box>
    </SafeAreaView>
  );
}
