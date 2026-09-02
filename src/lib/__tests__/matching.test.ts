/**
 * Dónde Hay - Matching Utilities Tests
 */

import {
  similarityScore,
  sameProduct,
  deriveAvailability,
  aggregateOffers,
  mergeByKey,
  buildOfferList,
} from '../matching';
import type {
  ProductOffer,
  ProductWithOffers,
  OfferAggregate,
} from '@/types';

const nowTs = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function offer(partial: Partial<ProductOffer> & { id: string; price: number }): ProductOffer {
  return {
    productId: 'p1',
    sellerId: '',
    sourceId: 'revolico',
    currency: 'USD',
    locationId: '',
    sourceUrl: '',
    postedAt: new Date(nowTs).toISOString(),
    status: 'active',
    ...partial,
  };
}

function product(
  canonicalName: string,
  offers: ProductOffer[],
  partial: Partial<ProductWithOffers> = {}
): ProductWithOffers {
  return {
    id: `p-${canonicalName}`,
    canonicalName,
    brand: '',
    model: '',
    categoryId: '',
    imageUrls: [],
    offers,
    offerCount: offers.length,
    availability: deriveAvailability(offers),
    createdAt: new Date(nowTs).toISOString(),
    updatedAt: new Date(nowTs).toISOString(),
    ...partial,
  };
}

describe('similarityScore', () => {
  it('is 1 for identical keys', () => {
    expect(similarityScore('a b c', 'a b c')).toBe(1);
  });

  it('is 0 when disjoint', () => {
    expect(similarityScore('a b', 'c d')).toBe(0);
  });

  it('is 1 for the empty/empty case', () => {
    expect(similarityScore('', '')).toBe(1);
  });
});

describe('sameProduct', () => {
  it('matches the same model written differently', () => {
    expect(
      sameProduct('iPhone 13 128gb', 'iPhone 13 128 GB')
    ).toBe(true);
  });

  it('does not match different variants', () => {
    expect(sameProduct('iPhone 13', 'iPhone 13 Pro')).toBe(false);
  });

  it('does not match different capacities', () => {
    expect(sameProduct('iPhone 13 128gb', 'iPhone 13 256gb')).toBe(false);
  });
});

describe('deriveAvailability', () => {
  it('returns unknown when no offers', () => {
    expect(deriveAvailability([])).toEqual({
      available: false,
      lastSeen: '',
      status: 'unknown',
    });
  });

  it('flags available when any offer is active', () => {
    const availability = deriveAvailability([
      offer({ id: 'o1', price: 10, status: 'inactive' }),
      offer({ id: 'o2', price: 12, status: 'active' }),
    ]);
    expect(availability.available).toBe(true);
    expect(availability.status).toBe('recent');
  });

  it('reports old when no recent offers', () => {
    const oldOffer = offer({
      id: 'o1',
      price: 10,
      postedAt: new Date(nowTs - 30 * DAY).toISOString(),
    });
    const availability = deriveAvailability([oldOffer], nowTs);
    expect(availability.status).toBe('old');
    expect(availability.available).toBe(true);
  });

  it('uses the most recent offer as lastSeen', () => {
    const availability = deriveAvailability([
      offer({ id: 'o1', price: 10, postedAt: new Date(nowTs - 3 * DAY).toISOString() }),
      offer({ id: 'o2', price: 12, postedAt: new Date(nowTs - HOUR).toISOString() }),
    ]);
    expect(availability.lastSeen).toBe(new Date(nowTs - HOUR).toISOString());
  });
});

describe('aggregateOffers', () => {
  it('computes min/max/avg, offerCount and sourceCount', () => {
    const offers = [
      offer({ id: 'o1', price: 100, sourceId: 'revolico' }),
      offer({ id: 'o2', price: 150, sourceId: 'revolico' }),
      offer({ id: 'o3', price: 200, sourceId: 'instagram' }),
    ];
    const agg: OfferAggregate = aggregateOffers(offers);
    expect(agg.offerCount).toBe(3);
    expect(agg.minPrice).toBe(100);
    expect(agg.maxPrice).toBe(200);
    expect(agg.averagePrice).toBe(150);
    expect(agg.sourceCount).toBe(2);
    expect(agg.sources).toEqual(expect.arrayContaining(['revolico', 'instagram']));
    expect(agg.availability.available).toBe(true);
  });

  it('handles empty offers', () => {
    const agg = aggregateOffers([]);
    expect(agg.offerCount).toBe(0);
    expect(agg.minPrice).toBeUndefined();
    expect(agg.maxPrice).toBeUndefined();
    expect(agg.averagePrice).toBeUndefined();
    expect(agg.sourceCount).toBe(0);
    expect(agg.availability.status).toBe('unknown');
  });
});

describe('mergeByKey', () => {
  it('merges products with the same productKey by appending offers', () => {
    const base = [
      product('iPhone 13', [offer({ id: 'o1', price: 100 })]),
    ];
    const incoming = [
      product('iPhone 13 128gb', [offer({ id: 'o2', price: 110 })]),
    ];
    const merged = mergeByKey(base, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.offers).toHaveLength(2);
    expect(merged[0]?.offerCount).toBe(2);
  });

  it('adds products that do not yet exist', () => {
    const base = [product('iPhone 13', [offer({ id: 'o1', price: 100 })])];
    const incoming = [
      product('PS5', [offer({ id: 'o9', price: 500 })]),
    ];
    const merged = mergeByKey(base, incoming);
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.canonicalName)).toEqual(['iPhone 13', 'PS5']);
  });

  it('does not merge different variants', () => {
    const base = [product('iPhone 13', [offer({ id: 'o1', price: 100 })])];
    const incoming = [
      product('iPhone 13 Pro', [offer({ id: 'o2', price: 200 })]),
    ];
    const merged = mergeByKey(base, incoming);
    expect(merged).toHaveLength(2);
  });

  it('recomputes aggregates after merging', () => {
    const base = [
      product('iPhone 13', [offer({ id: 'o1', price: 100 })]),
    ];
    const incoming = [
      product('iPhone 13 128gb', [offer({ id: 'o2', price: 300 })]),
    ];
    const merged = mergeByKey(base, incoming);
    expect(merged[0]?.minPrice).toBe(100);
    expect(merged[0]?.maxPrice).toBe(300);
  });
});

describe('buildOfferList', () => {
  const p = product('iPhone 13', [
    offer({ id: 'oB', price: 300, sourceId: 'instagram', sellerId: 's2' }),
    offer({ id: 'oA', price: 100, sourceId: 'revolico', sellerId: 's1' }),
  ]);

  it('orders offers by price ascending', () => {
    const list = buildOfferList(p);
    expect(list.map((o) => o.price)).toEqual([100, 300]);
  });

  it('maps source and seller names through the lookup maps', () => {
    const list = buildOfferList(p, {
      sources: { revolico: 'Revolico', instagram: 'Instagram' },
      sellers: { s1: 'Seller Uno', s2: 'Seller Dos' },
    });
    expect(list[0]?.sourceName).toBe('Revolico');
    expect(list[0]?.sellerName).toBe('Seller Uno');
    expect(list[1]?.sourceName).toBe('Instagram');
    expect(list[1]?.sellerName).toBe('Seller Dos');
  });

  it('falls back to sourceId when the source name is unknown', () => {
    const list = buildOfferList(p);
    expect(list[0]?.sourceName).toBe('revolico');
  });
});
