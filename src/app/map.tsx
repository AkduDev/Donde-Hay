/**
 * Dónde Hay - Nearby Screen
 * Productos cercanos con geolocalización; toggle Mapa / Lista.
 * Mapa interactivo (react-native-maps): marcadores, clusters y routing.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductMap, type ProductMapMarker } from '@/components/map/ProductMap';
import { useThemeStore } from '@/store/themeStore';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useNearbyProducts } from '@/hooks/use-products';
import { useLocationsByIds } from '@/hooks/use-locations';
import { useLocationStore } from '@/store/locationStore';

const RADIUS_OPTIONS = [5, 10, 25, 50];

type ViewMode = 'map' | 'list';

export default function NearbyScreen() {
  const { resolvedMode } = useThemeStore();
  const router = useRouter();
  const { userLocation, selectedRadius, setSelectedRadius } = useLocationStore();
  const {
    location: deviceLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentLocation,
  } = useDeviceLocation();

  const latitude = deviceLocation?.latitude || userLocation?.latitude;
  const longitude = deviceLocation?.longitude || userLocation?.longitude;

  const {
    data: nearbyProducts,
    isLoading: productsLoading,
    refetch,
    isRefetching,
  } = useNearbyProducts(latitude || 0, longitude || 0, selectedRadius);

  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const offerLocationIds = useMemo(() => {
    const ids = new Set<string>();
    for (const product of nearbyProducts ?? []) {
      for (const offer of product.offers ?? []) {
        if (offer.locationId) ids.add(offer.locationId);
      }
    }
    return Array.from(ids);
  }, [nearbyProducts]);

  const { data: locationCoords, isLoading: coordsLoading } = useLocationsByIds(offerLocationIds);

  const markers: ProductMapMarker[] = useMemo(() => {
    const coords = locationCoords ?? {};
    const result: ProductMapMarker[] = [];

    for (const product of nearbyProducts ?? []) {
      if (product.offers?.length === 0) continue;
      const offer = product.offers.find((o) => o.locationId && coords[o.locationId]);
      if (!offer?.locationId) continue;

      const coord = coords[offer.locationId];
      if (!coord) continue;
      result.push({
        id: product.id,
        productId: product.id,
        productName: product.canonicalName,
        price: product.minPrice ?? offer.price,
        currency: offer.currency,
        offerCount: product.offerCount ?? product.offers.length,
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
    }

    return result;
  }, [nearbyProducts, locationCoords]);

  const productsWithoutCoords = Math.max(
    (nearbyProducts?.length ?? 0) - markers.length,
    0
  );

  const canRenderMap = viewMode === 'map' && latitude && longitude;

  return (
    <Box flex={1} bg="background" mode={resolvedMode}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box px="md" py="md">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Box flexDirection="row" alignItems="center" gap="sm">
              <Pressable
                onPress={() => router.back()}
                accessibilityLabel="Volver a la pantalla anterior"
                accessibilityRole="button"
              >
                <Text variant="bodyLarge" color="primary">
                  ←
                </Text>
              </Pressable>
              <Text variant="headlineMedium" color="text">
                📍 Cerca de ti
              </Text>
            </Box>
            <Pressable
              onPress={() => setShowRadiusPicker(!showRadiusPicker)}
              accessibilityLabel={`Radio de búsqueda: ${selectedRadius} kilómetros. Pulsa para cambiar.`}
              accessibilityRole="button"
            >
              <Badge variant="primary" size="sm">
                {selectedRadius}km
              </Badge>
            </Pressable>
          </Box>

          {showRadiusPicker && (
            <Box mt="sm" flexDirection="row" gap="xs">
              {RADIUS_OPTIONS.map((radius) => (
                <Pressable
                  key={radius}
                  onPress={() => {
                    setSelectedRadius(radius);
                    setShowRadiusPicker(false);
                  }}
                  accessibilityLabel={`Radio ${radius} kilómetros`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedRadius === radius }}
                >
                  <Badge
                    variant={selectedRadius === radius ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {radius}km
                  </Badge>
                </Pressable>
              ))}
            </Box>
          )}

          <Box mt="xs">
            <Text variant="bodyMedium" color="textSecondary">
              {latitude && longitude
                ? `Mostrando productos en ${selectedRadius}km a la redonda`
                : 'Activa tu ubicación para ver productos cercanos'}
            </Text>
          </Box>

          <Box mt="sm" flexDirection="row" gap="xs">
            <Pressable
              onPress={() => setViewMode('map')}
              accessibilityLabel="Ver modo mapa"
              accessibilityRole="button"
              accessibilityState={{ selected: viewMode === 'map' }}
            >
              <Badge variant={viewMode === 'map' ? 'primary' : 'outline'} size="sm">
                Mapa
              </Badge>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('list')}
              accessibilityLabel="Ver modo lista"
              accessibilityRole="button"
              accessibilityState={{ selected: viewMode === 'list' }}
            >
              <Badge variant={viewMode === 'list' ? 'primary' : 'outline'} size="sm">
                Lista
              </Badge>
            </Pressable>
          </Box>
        </Box>

        {!latitude && !locationLoading && (
          <Box px="md" mb="md">
            <Card variant="elevated" padding="lg" mode={resolvedMode}>
              <Box alignItems="center" gap="md">
                <Text variant="displaySmall">🛰️</Text>
                <Text variant="titleMedium" color="text" textAlign="center">
                  Necesitamos tu ubicación
                </Text>
                <Text variant="bodyMedium" color="textSecondary" textAlign="center">
                  Para encontrar productos cerca de ti, necesitamos acceso a tu ubicación.
                </Text>
                {locationError && (
                  <Text variant="bodySmall" color="error" textAlign="center">
                    {locationError}
                  </Text>
                )}
                <Button
                  variant="primary"
                  onPress={handleLocationPress}
                  accessibilityLabel="Activar ubicación para ver productos cercanos"
                >
                  Activar ubicación
                </Button>
              </Box>
            </Card>
          </Box>
        )}

        {canRenderMap ? (
          <Box px="md">
            <ProductMap
              markers={markers}
              center={{ latitude, longitude }}
              onProductPress={handleProductPress}
            />
            {coordsLoading && (
              <Box mt="xs">
                <Text variant="bodySmall" color="textSecondary" textAlign="center">
                  Cargando coordenadas de productos...
                </Text>
              </Box>
            )}
            {!coordsLoading && productsWithoutCoords > 0 && (
              <Box mt="xs">
                <Text variant="bodySmall" color="textSecondary" textAlign="center">
                  {productsWithoutCoords} producto{productsWithoutCoords === 1 ? '' : 's'} no tienen
                  coordenadas — cambia a Lista para verlos.
                </Text>
              </Box>
            )}
            {!coordsLoading &&
              markers.length === 0 &&
              nearbyProducts &&
              nearbyProducts.length > 0 && (
                <Box mt="xs">
                  <Text variant="bodySmall" color="textSecondary" textAlign="center">
                    Aún no hay productos con coordenadas cargadas en este radio.
                  </Text>
                </Box>
              )}
          </Box>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching || false} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {locationLoading ? (
              <Box alignItems="center" py="xl">
                <ActivityIndicator size="large" />
                <Text variant="bodyMedium" color="textSecondary">
                  Obteniendo tu ubicación...
                </Text>
              </Box>
            ) : productsLoading ? (
              <Box alignItems="center" py="xl">
                <ActivityIndicator size="large" />
                <Text variant="bodyMedium" color="textSecondary">
                  Buscando productos cercanos...
                </Text>
              </Box>
            ) : nearbyProducts && nearbyProducts.length > 0 ? (
              <Box gap="md">
                {nearbyProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => handleProductPress(product.id)}
                    accessibilityLabel={`${product.canonicalName}, ${product.brand} ${product.model}, precio ${product.minPrice?.toFixed(2) || product.offers[0]?.price.toFixed(2) || '0.00'} dólares`}
                    accessibilityRole="button"
                  >
                    <Card variant="elevated" padding="md" mode={resolvedMode}>
                      <Box flexDirection="row" gap="md">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <Box
                            width={80}
                            height={80}
                            borderRadius="md"
                            bg="surfaceVariant"
                            overflow="hidden"
                          >
                            <Image
                              source={{ uri: product.imageUrls[0] }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                            />
                          </Box>
                        ) : (
                          <Box
                            width={80}
                            height={80}
                            borderRadius="md"
                            bg="surfaceVariant"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text variant="headlineSmall">📦</Text>
                          </Box>
                        )}
                        <Box flex={1} justifyContent="center">
                          <Text variant="titleMedium" color="text" numberOfLines={1}>
                            {product.canonicalName}
                          </Text>
                          <Text variant="bodySmall" color="textSecondary">
                            {product.brand} • {product.model}
                          </Text>
                          <Box flexDirection="row" alignItems="center" gap="sm">
                            <Text variant="titleSmall" color="primary">
                              ${product.minPrice?.toFixed(2) || product.offers[0]?.price.toFixed(2) || '0.00'}
                            </Text>
                            <Badge variant="outline" size="sm">
                              {product.offerCount} ofertas
                            </Badge>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Pressable>
                ))}
              </Box>
            ) : latitude ? (
              <Box alignItems="center" py="xl">
                <Text variant="displaySmall">🔍</Text>
                <Text variant="titleMedium" color="text">
                  No hay productos cerca
                </Text>
                <Text variant="bodyMedium" color="textSecondary">
                  No encontramos productos en un radio de {selectedRadius}km.
                </Text>
                <Button
                  variant="outline"
                  onPress={() => setSelectedRadius(selectedRadius * 2)}
                  accessibilityLabel={`Ampliar radio a ${selectedRadius * 2} kilómetros`}
                >
                  Ampliar radio a {selectedRadius * 2}km
                </Button>
              </Box>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </Box>
  );
}