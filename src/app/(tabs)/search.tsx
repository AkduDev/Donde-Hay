/**
 * Dónde Hay - Search Screen
 * Pantalla principal de búsqueda con filtros, ordenamiento y resultados
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SearchBar, type SearchSuggestion } from '@/components/search/SearchBar';
import { FilterSheet, type FilterState } from '@/components/search/FilterSheet';
import { SortSelector, type SortOption } from '@/components/search/SortSelector';
import { ProductCard } from '@/components/product/ProductCard';
import { getColors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';
import { useThemeStore } from '@/store/themeStore';
import type { ProductWithOffers } from '@/types';

// ============================================
// DATOS MOCK (hasta conectar con API real)
// ============================================

const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  { id: '1', text: 'iPhone 13', type: 'trending' },
  { id: '2', text: 'iPhone 12', type: 'suggestion' },
  { id: '3', text: 'Laptop HP', type: 'trending' },
  { id: '4', text: 'PS5', type: 'trending' },
  { id: '5', text: 'Toyota Corolla', type: 'history' },
  { id: '6', text: 'Samsung Galaxy S23', type: 'suggestion' },
  { id: '7', text: 'Nintendo Switch', type: 'trending' },
  { id: '8', text: 'Air Fryer', type: 'suggestion' },
];

const MOCK_PROVINCES = [
  { id: 'lha', label: 'La Habana' },
  { id: 'scu', label: 'Santiago de Cuba' },
  { id: 'cam', label: 'Camagüey' },
  { id: 'hol', label: 'Holguín' },
  { id: 'vcl', label: 'Villa Clara' },
  { id: 'mat', label: 'Matanzas' },
];

const MOCK_SOURCES = [
  { id: 'revolico', label: 'Revolico' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'comunidad', label: 'Comunidad' },
];

const MOCK_PRODUCTS: ProductWithOffers[] = [
  {
    id: '1',
    canonicalName: 'iPhone 13 128GB',
    brand: 'Apple',
    model: 'iPhone 13',
    categoryId: 'tech',
    description: 'iPhone 13 128GB en excelente estado',
    imageUrls: [],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
    offers: [
      {
        id: 'o1',
        productId: '1',
        sellerId: 's1',
        sourceId: 'revolico',
        price: 430,
        currency: 'USD',
        locationId: 'lha',
        sourceUrl: 'https://revolico.com/1',
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
      {
        id: 'o2',
        productId: '1',
        sellerId: 's2',
        sourceId: 'instagram',
        price: 450,
        currency: 'USD',
        locationId: 'lha',
        sourceUrl: 'https://instagram.com/1',
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
      {
        id: 'o3',
        productId: '1',
        sellerId: 's3',
        sourceId: 'facebook',
        price: 480,
        currency: 'USD',
        locationId: 'mat',
        sourceUrl: 'https://facebook.com/1',
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
    ],
    offerCount: 3,
    averagePrice: 453,
    minPrice: 430,
    maxPrice: 480,
    availability: {
      available: true,
      lastSeen: new Date().toISOString(),
      status: 'recent',
    },
  },
  {
    id: '2',
    canonicalName: 'Laptop HP Pavilion 15',
    brand: 'HP',
    model: 'Pavilion 15',
    categoryId: 'computing',
    description: 'Laptop HP Pavilion 15, Ryzen 5, 16GB RAM',
    imageUrls: [],
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-13T08:00:00Z',
    offers: [
      {
        id: 'o4',
        productId: '2',
        sellerId: 's4',
        sourceId: 'revolico',
        price: 380,
        currency: 'USD',
        locationId: 'vcl',
        sourceUrl: 'https://revolico.com/2',
        postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
    ],
    offerCount: 1,
    minPrice: 380,
    maxPrice: 380,
    availability: {
      available: true,
      lastSeen: new Date().toISOString(),
      status: 'recent',
    },
  },
  {
    id: '3',
    canonicalName: 'PlayStation 5 Slim',
    brand: 'Sony',
    model: 'PS5 Slim',
    categoryId: 'gaming',
    description: 'PS5 Slim con lector de discos, 1TB',
    imageUrls: [],
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-11T08:00:00Z',
    offers: [
      {
        id: 'o5',
        productId: '3',
        sellerId: 's5',
        sourceId: 'instagram',
        price: 600,
        currency: 'USD',
        locationId: 'lha',
        sourceUrl: 'https://instagram.com/2',
        postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
      {
        id: 'o6',
        productId: '3',
        sellerId: 's6',
        sourceId: 'comunidad',
        price: 650,
        currency: 'USD',
        locationId: 'scu',
        sourceUrl: 'https://dondehay.app/2',
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
    ],
    offerCount: 2,
    minPrice: 600,
    maxPrice: 650,
    availability: {
      available: true,
      lastSeen: new Date().toISOString(),
      status: 'old',
    },
  },
];

/** Simula búsqueda de productos (reemplazar por API real) */
async function searchProducts(query: string): Promise<ProductWithOffers[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (!query.trim()) return MOCK_PRODUCTS;
  const lower = query.toLowerCase();
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.canonicalName.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower)
  );
}

// ============================================
// PANTALLA
// ============================================

const DEFAULT_FILTERS: FilterState = {
  currency: 'USD',
  sourceIds: [],
  condition: 'any',
  postedWithin: 'any',
};

export default function SearchScreen() {
  const { resolvedMode } = useThemeStore();
  const colors = getColors(resolvedMode);

  // Estado de búsqueda
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query de TanStack (con datos simulados)
  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['search', submittedQuery, sortBy, filters],
    queryFn: () => searchProducts(submittedQuery),
    placeholderData: keepPreviousData,
    enabled: true,
  });

  // Filtrado y ordenamiento en memoria (mock)
  const processedResults = useMemo(() => {
    let items = [...(results ?? [])];

    // Filtro por precio
    if (filters.minPrice !== undefined) {
      items = items.filter((p) => (p.minPrice ?? 0) >= (filters.minPrice ?? 0));
    }
    if (filters.maxPrice !== undefined) {
      items = items.filter((p) => (p.minPrice ?? Infinity) <= (filters.maxPrice ?? Infinity));
    }

    // Filtro por fuentes
    if (filters.sourceIds.length > 0) {
      items = items.filter((p) =>
        p.offers?.some((o) => filters.sourceIds.includes(o.sourceId))
      );
    }

    // Filtro por ubicación
    if (filters.provinceId) {
      items = items.filter((p) =>
        p.offers?.some((o) => o.locationId === filters.provinceId)
      );
    }

    // Ordenamiento
    switch (sortBy) {
      case 'price-asc':
        items.sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
        break;
      case 'price-desc':
        items.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
        break;
      case 'recent':
        items.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      default:
        break; // relevance: mantener orden
    }

    return items;
  }, [results, filters, sortBy]);

  // Handlers
  const handleSubmitSearch = useCallback((searchText: string) => {
    setSubmittedQuery(searchText);
  }, []);

  const handleApplyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleToggleFavorite = useCallback((product: ProductWithOffers) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.provinceId) count++;
    if (filters.sourceIds.length > 0) count++;
    if (filters.condition !== 'any') count++;
    if (filters.postedWithin !== 'any') count++;
    return count;
  }, [filters]);

  const renderProduct = useCallback(
    ({ item }: { item: ProductWithOffers }) => (
      <ProductCard
        product={item}
        layout={layout}
        isFavorite={favorites.has(item.id)}
        onFavoritePress={handleToggleFavorite}
        onPress={(p) => {
          // TODO: router.push(`/product/${p.id}`)
          console.log('Navigate to product:', p.id);
        }}
        testID={`search-result-${item.id}`}
      />
    ),
    [layout, favorites, handleToggleFavorite]
  );

  const keyExtractor = useCallback((item: ProductWithOffers) => item.id, []);

  const ListEmptyComponent = () => {
    if (isLoading) {
      return (
        <Box alignItems="center" justifyContent="center" py={12} mode={resolvedMode}>
          <Spinner size="lg" label="Buscando productos..." mode={resolvedMode} />
        </Box>
      );
    }

    if (isError) {
      return (
        <Box alignItems="center" justifyContent="center" py={12} gap={4} mode={resolvedMode}>
          <Text variant="headlineMedium" mode={resolvedMode}>⚠️</Text>
          <Text variant="titleMedium" color="text" mode={resolvedMode}>
            Algo salió mal
          </Text>
          <Text variant="bodyMedium" color="textSecondary" mode={resolvedMode} textAlign="center">
            No pudimos completar la búsqueda. Intenta de nuevo.
          </Text>
          <Button variant="primary" onPress={() => refetch()} mode={resolvedMode}>
            Reintentar
          </Button>
        </Box>
      );
    }

    return (
      <Box alignItems="center" justifyContent="center" py={12} gap={4} mode={resolvedMode}>
        <Text variant="headlineMedium" mode={resolvedMode}>🔍</Text>
        <Text variant="titleMedium" color="text" mode={resolvedMode}>
          Sin resultados
        </Text>
        <Text
          variant="bodyMedium"
          color="textSecondary"
          mode={resolvedMode}
          textAlign="center"
          style={{ paddingHorizontal: Spacing[6] }}
        >
          {submittedQuery
            ? `No encontramos "${submittedQuery}". Prueba con otros términos o ajusta los filtros.`
            : 'Escribe lo que buscas y encuentra dónde hay lo que necesitas.'}
        </Text>
        {(submittedQuery || activeFilterCount > 0) && (
          <Button
            variant="outline"
            onPress={() => {
              setQuery('');
              setSubmittedQuery('');
              handleResetFilters();
            }}
            mode={resolvedMode}
          >
            Limpiar búsqueda
          </Button>
        )}
      </Box>
    );
  };

  const ListHeaderComponent = () => (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      mb={3}
      mode={resolvedMode}
    >
      {/* Contador de resultados */}
      <Text variant="bodySmall" color="textSecondary" mode={resolvedMode}>
        {isLoading
          ? 'Buscando...'
          : `${processedResults.length} ${processedResults.length === 1 ? 'resultado' : 'resultados'}`}
      </Text>

      <Box flexDirection="row" alignItems="center" gap={2} mode={resolvedMode}>
        <SortSelector value={sortBy} onChange={setSortBy} testID="search-sort" />

        {/* Filtro de layout list/grid */}
        <Pressable
          onPress={() => setLayout(layout === 'list' ? 'grid' : 'list')}
          testID="search-layout-toggle"
          accessibilityLabel={layout === 'list' ? 'Cambiar a vista de cuadrícula' : 'Cambiar a vista de lista'}
          accessibilityRole="button"
        >
          <Box
            px={3}
            py={2}
            borderRadius="full"
            borderWidth={1.5}
            borderColor="border"
            bg="surface"
            mode={resolvedMode}
          >
            <Text variant="bodySmall" mode={resolvedMode}>
              {layout === 'list' ? '▦' : '☰'}
            </Text>
          </Box>
        </Pressable>
      </Box>
    </Box>
  );

  return (
    <Box flex={1} bg="background" mode={resolvedMode} testID="search-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header con SearchBar */}
        <Box px={4} py={3} bg="surface" mode={resolvedMode} style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={handleSubmitSearch}
            suggestions={MOCK_SUGGESTIONS}
            onSuggestionPress={(s) => {
              setQuery(s.text);
              handleSubmitSearch(s.text);
            }}
            placeholder="¿Dónde hay...? iPhone, laptop, TV"
            autoFocus={false}
            testID="search-bar"
          />

          {/* Chips de filtros activos */}
          {activeFilterCount > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: Spacing[2] }}
            >
              <Box flexDirection="row" gap={2} mode={resolvedMode}>
                {filters.provinceId && (
                  <Pressable
                    onPress={() => setFilters((f) => ({ ...f, provinceId: undefined, municipalityId: undefined }))}
                    testID="search-filter-chip-province"
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap={1}
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="primaryContainer"
                      mode={resolvedMode}
                    >
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>
                        📍 {MOCK_PROVINCES.find((p) => p.id === filters.provinceId)?.label ?? filters.provinceId}
                      </Text>
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>✕</Text>
                    </Box>
                  </Pressable>
                )}
                {filters.maxPrice !== undefined && (
                  <Pressable
                    onPress={() => setFilters((f) => ({ ...f, maxPrice: undefined }))}
                    testID="search-filter-chip-price"
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap={1}
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="primaryContainer"
                      mode={resolvedMode}
                    >
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>
                        💰 Hasta ${filters.maxPrice}
                      </Text>
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>✕</Text>
                    </Box>
                  </Pressable>
                )}
                {filters.sourceIds.map((sourceId) => (
                  <Pressable
                    key={sourceId}
                    onPress={() =>
                      setFilters((f) => ({
                        ...f,
                        sourceIds: f.sourceIds.filter((id) => id !== sourceId),
                      }))
                    }
                    testID={`search-filter-chip-source-${sourceId}`}
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      gap={1}
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="primaryContainer"
                      mode={resolvedMode}
                    >
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>
                        {MOCK_SOURCES.find((s) => s.id === sourceId)?.label ?? sourceId}
                      </Text>
                      <Text variant="labelSmall" color="primary" mode={resolvedMode}>✕</Text>
                    </Box>
                  </Pressable>
                ))}
              </Box>
            </ScrollView>
          )}
        </Box>

        {/* Controles: filtro + sort */}
        <Box
          px={4}
          py={2}
          flexDirection="row"
          alignItems="center"
          gap={2}
          mode={resolvedMode}
        >
          <Pressable
            onPress={() => setFilterSheetVisible(true)}
            testID="search-filter-button"
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros"
          >
            <Box
              flexDirection="row"
              alignItems="center"
              gap={2}
              px={3}
              py={2}
              borderRadius="full"
              borderWidth={1.5}
              borderColor={activeFilterCount > 0 ? 'primary' : 'border'}
              bg={activeFilterCount > 0 ? 'primaryContainer' : 'surface'}
              mode={resolvedMode}
            >
              <Text variant="bodySmall" mode={resolvedMode}>⚙️</Text>
              <Text
                variant="labelMedium"
                color={activeFilterCount > 0 ? 'primary' : 'textSecondary'}
                mode={resolvedMode}
              >
                Filtros
              </Text>
              {activeFilterCount > 0 && (
                <Box
                  width={18}
                  height={18}
                  borderRadius="full"
                  bg="primary"
                  alignItems="center"
                  justifyContent="center"
                  mode={resolvedMode}
                >
                  <Text variant="labelSmall" color="onPrimary" mode={resolvedMode}>
                    {activeFilterCount}
                  </Text>
                </Box>
              )}
            </Box>
          </Pressable>
        </Box>

        {/* Lista de resultados */}
        <FlatList
          data={processedResults}
          keyExtractor={keyExtractor}
          renderItem={renderProduct}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          key={layout} // Forzar re-render cuando cambia layout
          numColumns={layout === 'grid' ? 2 : 1}
          columnWrapperStyle={
            layout === 'grid'
              ? { justifyContent: 'space-between', marginBottom: Spacing[3] }
              : undefined
          }
          contentContainerStyle={{
            paddingHorizontal: Spacing[4],
            paddingBottom: Spacing[8],
            flexGrow: 1,
          }}
          ItemSeparatorComponent={
            layout === 'list' ? () => <Box height={Spacing[3]} mode={resolvedMode} /> : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          testID="search-results-list"
        />
      </SafeAreaView>

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        provinces={MOCK_PROVINCES}
        sources={MOCK_SOURCES}
        testID="search-filter-sheet"
      />
    </Box>
  );
}