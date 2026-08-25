/**
 * Dónde Hay - Nearby Screen
 * Productos cercanos con geolocalización real
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, Pressable, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useNearbyProducts } from '@/hooks/use-products';
import { useLocationStore } from '@/store/locationStore';

const RADIUS_OPTIONS = [5, 10, 25, 50];

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

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <Box flex={1} bg="background" mode={resolvedMode}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Box px="md" py="md">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="headlineMedium" color="text">
              📍 Cerca de ti
            </Text>
            <Pressable onPress={() => setShowRadiusPicker(!showRadiusPicker)}>
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
                >
                  Activar ubicación
                </Button>
              </Box>
            </Card>
          </Box>
        )}

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
                            resizeMode="cover"
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
              >
                Ampliar radio a {selectedRadius * 2}km
              </Button>
            </Box>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
