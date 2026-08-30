/**
 * Dónde Hay - Utilidades de mapa
 * Cálculo de distancias (haversine), clustering por grilla y enlaces externos
 * de navegación (routing). Funciones puras y unit-testables.
 */

import { Platform } from 'react-native';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ClusterItem extends GeoPoint {
  id: string;
}

export interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  itemIds: string[];
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Distancia haversine entre dos puntos, en kilómetros.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Agrupa puntos en clusters por grilla basada en el área visible del mapa
 * (latDelta/lngDelta del región). Cada celda con 1 punto es un marcador suelto;
 * con 2+ puntos, un cluster centrado en el centroide.
 */
export function buildClusters<T extends ClusterItem>(
  items: T[],
  latDelta: number,
  lngDelta: number,
  divisions = 4
): MapCluster[] {
  if (items.length === 0) return [];

  const cellLat = Math.max(latDelta, 1e-6) / divisions;
  const cellLng = Math.max(lngDelta, 1e-6) / divisions;

  const grid = new Map<string, ClusterItem[]>();

  for (const item of items) {
    const col = Math.floor(item.latitude / cellLat);
    const row = Math.floor(item.longitude / cellLng);
    const key = `${col}:${row}`;
    const bucket = grid.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grid.set(key, [item]);
    }
  }

  const clusters: MapCluster[] = [];

  for (const [key, bucket] of grid) {
    if (bucket.length === 1) {
      const item = bucket[0];
      if (!item) continue;
      clusters.push({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        count: 1,
        itemIds: [item.id],
      });
    } else {
      let latitude = 0;
      let longitude = 0;
      const itemIds: string[] = [];
      for (const item of bucket) {
        latitude += item.latitude;
        longitude += item.longitude;
        itemIds.push(item.id);
      }
      clusters.push({
        id: `cluster-${key}`,
        latitude: latitude / bucket.length,
        longitude: longitude / bucket.length,
        count: bucket.length,
        itemIds,
      });
    }
  }

  return clusters;
}

/**
 * URL de "Cómo llegar" (routing) hasta un punto, en la app de mapas del OS.
 */
export function directionsUrl(point: GeoPoint): string {
  const coords = `${point.latitude},${point.longitude}`;
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${coords}`
    : `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
}

/**
 * URL para abrir una ubicación en la app de mapas del OS.
 */
export function mapsLinkUrl(point: GeoPoint): string {
  const coords = `${point.latitude},${point.longitude}`;
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?ll=${coords}`
    : `https://www.google.com/maps/search/?api=1&query=${coords}`;
}