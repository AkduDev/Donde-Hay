/**
 * Dónde Hay - Map Utilities Tests
 */

import { haversineKm, buildClusters } from '../../lib/map';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    const point = { latitude: 23.1136, longitude: -82.3666 };
    expect(haversineKm(point, point)).toBe(0);
  });

  it('computes ~81km for Havana to Matanzas', () => {
    const habana = { latitude: 23.1136, longitude: -82.3666 };
    const matanzas = { latitude: 23.0472, longitude: -81.5775 };
    const distance = haversineKm(habana, matanzas);
    expect(distance).toBeGreaterThan(70);
    expect(distance).toBeLessThan(95);
  });

  it('is symmetric', () => {
    const a = { latitude: 20.0, longitude: -77.0 };
    const b = { latitude: 21.0, longitude: -78.0 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 5);
  });
});

describe('buildClusters', () => {
  const items = [
    { id: 'a', latitude: 23.1, longitude: -82.3 },
    { id: 'b', latitude: 23.1, longitude: -82.3 },
    { id: 'c', latitude: 23.5, longitude: -82.5 },
  ];

  it('clusters points in the same grid cell', () => {
    const clusters = buildClusters(items, 0.5, 0.5, 4);
    const clusterForAB = clusters.find((c) => c.itemIds.includes('a'));
    expect(clusterForAB?.count).toBe(2);
  });

  it('keeps isolated points as count 1', () => {
    const clusters = buildClusters(items, 0.5, 0.5, 4);
    const clusterC = clusters.find((c) => c.itemIds.includes('c'));
    expect(clusterC?.count).toBe(1);
    expect(clusterC?.id).toBe('c');
  });

  it('centroid of a cluster averages member coordinates', () => {
    const clusters = buildClusters(items, 0.5, 0.5, 4);
    const clusterForAB = clusters.find((c) => c.itemIds.includes('a'));
    expect(clusterForAB?.latitude).toBeCloseTo(23.1, 5);
    expect(clusterForAB?.longitude).toBeCloseTo(-82.3, 5);
  });

  it('returns empty array for empty input', () => {
    expect(buildClusters([], 1, 1)).toEqual([]);
  });

  it('keeps far-apart points in different grid cells isolated', () => {
    const habana = { id: 'habana', latitude: 23.1, longitude: -82.3 };
    const santiago = { id: 'santiago', latitude: 20.0, longitude: -75.8 };
    const clusters = buildClusters([habana, santiago], 0.5, 0.5, 4);
    expect(clusters.length).toBe(2);
    for (const cluster of clusters) {
      expect(cluster.count).toBe(1);
    }
  });

  it('preserves item count sum across clusters', () => {
    const clusters = buildClusters(items, 0.5, 0.5, 4);
    const total = clusters.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(items.length);
  });
});