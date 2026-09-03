/**
 * Dónde Hay - ProductCard Component Tests
 * Contrato agrupado: precio mínimo + "en N lugares" + chips de fuentes
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '@/components/product/ProductCard';
import { useThemeStore } from '@/store/themeStore';
import type { ProductOffer, ProductWithOffers } from '@/types';

beforeEach(() => {
  useThemeStore.setState({ resolvedMode: 'light', isLoading: false });
});

function offer(id: string, sourceId: string, price: number, postedAt: string): ProductOffer {
  return {
    id,
    productId: 'p1',
    sellerId: 's1',
    sourceId,
    price,
    currency: 'USD',
    locationId: 'la-habana',
    sourceUrl: 'https://example.com/oferta',
    postedAt,
    status: 'active',
    rawData: { sellerPhone: '+5351111111' },
  };
}

function product(overrides?: Partial<ProductWithOffers>): ProductWithOffers {
  const base: ProductWithOffers = {
    id: 'p1',
    canonicalName: 'iPhone 13 128GB',
    brand: 'Apple',
    model: 'iPhone 13',
    categoryId: 'electronics',
    imageUrls: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    offers: [
      offer('o1', 'revolico', 420, '2026-08-29T10:00:00Z'),
      offer('o2', 'instagram', 435, '2026-08-28T10:00:00Z'),
    ],
    offerCount: 2,
    availability: { available: true, lastSeen: '2026-08-29T10:00:00Z', status: 'recent' },
  };
  return { ...base, ...overrides };
}

describe('ProductCard', () => {
  it('renders name, cheapest price and offer count', async () => {
    await render(<ProductCard product={product()} testID="pc" />);
    expect(screen.getByText('iPhone 13 128GB')).toBeTruthy();
    expect(screen.getByText('$420')).toBeTruthy();
    expect(screen.getByText('en 2 lugares')).toBeTruthy();
  });

  it('renders source chips per source', async () => {
    await render(<ProductCard product={product()} testID="pc" />);
    expect(screen.getAllByText('Revolico').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Instagram').length).toBeGreaterThanOrEqual(1);
  });

  it('fires onPress', async () => {
    const onPress = jest.fn();
    await render(<ProductCard product={product()} onPress={onPress} testID="pc" />);
    fireEvent.press(screen.getByTestId('pc'));
    expect(onPress).toHaveBeenCalledWith(product());
  });

  it('toggles favorite', async () => {
    const onFavoritePress = jest.fn();
    await render(
      <ProductCard product={product()} onFavoritePress={onFavoritePress} testID="pc" />
    );
    fireEvent.press(screen.getByTestId('pc-favorite'));
    expect(onFavoritePress).toHaveBeenCalledTimes(1);
  });

  it('renders grid layout variant', async () => {
    await render(<ProductCard product={product()} layout="grid" testID="pc" />);
    expect(screen.getByText('iPhone 13 128GB')).toBeTruthy();
    expect(screen.getByText('2 lugares')).toBeTruthy();
  });
});