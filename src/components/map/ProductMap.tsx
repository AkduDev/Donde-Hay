/**
 * Dónde Hay - ProductMap Component
 * Mapa interactivo con react-native-maps: marcadores de productos, clustering
 * por grilla (zoom al pulsar un cluster), callout de producto y routing externo.
 *
 * El módulo nativo se carga de forma perezosa y segura: si el APK/Expo Go actual
 * no tiene linkado react-native-maps, se muestra un fallback con enlace a la app
 * de mapas (nunca crashea el bundle).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { MapViewProps, MapMarkerProps, Region } from 'react-native-maps';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { Spacing } from '@/theme/spacing';
import { buildClusters, directionsUrl, mapsLinkUrl } from '@/lib/map';

export interface ProductMapMarker {
  id: string;
  productId: string;
  productName: string;
  price?: number;
  currency?: string;
  offerCount: number;
  latitude: number;
  longitude: number;
}

export interface ProductMapProps {
  markers: ProductMapMarker[];
  center: { latitude: number; longitude: number };
  onProductPress: (productId: string) => void;
  height?: number;
}

interface MapsApi {
  MapView: React.ComponentType<MapViewProps>;
  Marker: React.ComponentType<MapMarkerProps>;
}

function loadMapsApi(): MapsApi | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import dinámico: sólo en native, módulo opcional con fallback
    const mod = require('react-native-maps') as Record<string, unknown>;
    if (!mod) return null;
    const MapView = (mod['default'] ?? mod['MapView']) as React.ComponentType<MapViewProps> | undefined;
    const Marker = mod['Marker'] as React.ComponentType<MapMarkerProps> | undefined;
    if (!MapView || !Marker) return null;
    return { MapView, Marker };
  } catch {
    return null;
  }
}

const INITIAL_DELTA = 0.12;

export function ProductMap({ markers, center, onProductPress, height = 440 }: ProductMapProps) {
  const { resolvedMode } = useThemeStore();
  const [mapsApi] = useState(() => loadMapsApi());
  const [region, setRegion] = useState<Region>(() => ({
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
  }));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markersById = useMemo(() => {
    const map = new Map<string, ProductMapMarker>();
    for (const marker of markers) {
      map.set(marker.id, marker);
    }
    return map;
  }, [markers]);

  const clusters = useMemo(
    () =>
      buildClusters(
        markers.map((m) => ({ id: m.id, latitude: m.latitude, longitude: m.longitude })),
        region.latitudeDelta,
        region.longitudeDelta
      ),
    [markers, region.latitudeDelta, region.longitudeDelta]
  );

  const selectedMarker = selectedId ? markersById.get(selectedId) : undefined;

  const handleRegionChange = useCallback((nextRegion: Region) => {
    setRegion(nextRegion);
  }, []);

  const handleClusterPress = useCallback(
    (latitude: number, longitude: number) => {
      setRegion((prev) => ({
        ...prev,
        latitude,
        longitude,
        latitudeDelta: prev.latitudeDelta / 3,
        longitudeDelta: prev.longitudeDelta / 3,
      }));
    },
    []
  );

  const handleOpenDirections = useCallback(() => {
    if (!selectedMarker) return;
    Linking.openURL(directionsUrl({ latitude: selectedMarker.latitude, longitude: selectedMarker.longitude }));
  }, [selectedMarker]);

  if (!mapsApi) {
    return (
      <Box
        height={height}
        borderRadius="lg"
        bg="surfaceVariant"
        alignItems="center"
        justifyContent="center"
        gap="sm"
        px="md"
        mode={resolvedMode}
      >
        <Text variant="displaySmall" textAlign="center">
          🗺️
        </Text>
        <Text variant="titleMedium" color="text" textAlign="center">
          Mapa no disponible en esta compilación
        </Text>
        <Text variant="bodyMedium" color="textSecondary" textAlign="center">
          Esta versión de la app no incluye el módulo nativo de mapas. Tras el rebuild con
          react-native-maps verás marcadores y clusters. Puedes abrir la zona en tu app de mapas:
        </Text>
        <Button
          variant="primary"
          onPress={() => Linking.openURL(mapsLinkUrl(center))}
          accessibilityLabel="Abrir la ubicación en Google Maps"
        >
          Abrir en Google Maps
        </Button>
        {markers.length > 0 && (
          <Text variant="bodySmall" color="textSecondary" textAlign="center">
            {markers.length} producto{markers.length === 1 ? '' : 's'} con coordenadas en esta zona
          </Text>
        )}
      </Box>
    );
  }

  const MapViewComponent = mapsApi.MapView;
  const MarkerComponent = mapsApi.Marker;

  return (
    <Box height={height} overflow="hidden" borderRadius="lg" mode={resolvedMode}>
      <MapViewComponent
        style={{ flex: 1 }}
        userInterfaceStyle={resolvedMode}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        toolbarEnabled={false}
        accessibilityLabel="Mapa de productos cercanos"
      >
        {clusters.map((cluster) => {
          if (cluster.count === 1) {
            const marker = cluster.itemIds[0] ? markersById.get(cluster.itemIds[0]) : undefined;
            if (!marker) return null;
            return (
              <MarkerComponent
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.productName}
                description={descriptionFor(marker)}
                onPress={() => setSelectedId(marker.id)}
                onCalloutPress={() => onProductPress(marker.productId)}
              />
            );
          }

          return (
            <MarkerComponent
              key={cluster.id}
              coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
              onPress={() => handleClusterPress(cluster.latitude, cluster.longitude)}
            >
              <Box
                width={34}
                height={34}
                borderRadius="full"
                bg="primary"
                alignItems="center"
                justifyContent="center"
                style={{ borderWidth: 2, borderColor: '#FFFFFF' }}
              >
                <Text variant="titleSmall" color="onPrimary">
                  {cluster.count}
                </Text>
              </Box>
            </MarkerComponent>
          );
        })}
      </MapViewComponent>

      {selectedMarker && (
        <Box
          position="absolute"
          style={{ left: Spacing.md, right: Spacing.md, bottom: Spacing.md }}
        >
          <Card variant="elevated" padding="md" mode={resolvedMode}>
            <Box flexDirection="row" alignItems="center" gap="sm">
              <Box flex={1}>
                <Text variant="titleMedium" color="text" numberOfLines={1}>
                  {selectedMarker.productName}
                </Text>
                <Box flexDirection="row" alignItems="center" gap="sm" mt="xxxs">
                  <Text variant="titleSmall" color="primary">
                    {formatPrice(selectedMarker)}
                  </Text>
                  <Badge variant="outline" size="sm">
                    {selectedMarker.offerCount} ofertas
                  </Badge>
                </Box>
              </Box>
            </Box>
            <Box flexDirection="row" gap="sm" mt="sm">
              <Box flex={1}>
                <Button
                  variant="primary"
                  onPress={() => onProductPress(selectedMarker.productId)}
                  accessibilityLabel={`Ver el producto ${selectedMarker.productName}`}
                >
                  Ver producto
                </Button>
              </Box>
              <Box flex={1}>
                <Button
                  variant="outline"
                  onPress={handleOpenDirections}
                  accessibilityLabel={`Cómo llegar a ${selectedMarker.productName}`}
                >
                  Cómo llegar
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}

function descriptionFor(marker: ProductMapMarker): string {
  const parts = [formatPrice(marker)];
  if (marker.offerCount > 0) parts.push(`${marker.offerCount} ofertas`);
  return parts.join(' · ');
}

function formatPrice(marker: ProductMapMarker): string {
  if (marker.price === undefined || marker.price === null) return 'Precio N/D';
  const value = marker.price.toFixed(2);
  return `${marker.currency ?? 'USD'} ${value}`;
}