/**
 * Dónde Hay - Normalize Utilities Tests
 */

import {
  normalizeTitle,
  removeAccents,
  tokenize,
  stripStopwords,
  extractCapacity,
  extractBrand,
  buildCanonicalName,
  productKey,
  CATALOG_STOPWORDS,
} from '../normalize';

describe('removeAccents', () => {
  it('removes common Spanish accents and ñ', () => {
    expect(removeAccents('teléfono')).toBe('telefono');
    expect(removeAccents('CANCIÓN')).toBe('CANCIoN');
    expect(removeAccents('díez ü')).toBe('diez u');
  });

  it('leaves ASCII untouched', () => {
    expect(removeAccents('iPhone 13 Pro')).toBe('iPhone 13 Pro');
  });
});

describe('normalizeTitle', () => {
  it('lowercases, strips accents and punctuation, collapses spaces', () => {
    expect(normalizeTitle('  VENDO iPhone 13 Pro, 128GB — nuevo  ')).toBe(
      'vendo iphone 13 pro 128gb nuevo'
    );
  });

  it('handles slashes and x', () => {
    expect(normalizeTitle('PS5 x FIFA / 2 mandos')).toBe('ps5 x fifa 2 mandos');
  });
});

describe('tokenize', () => {
  it('splits on single spaces', () => {
    expect(tokenize('a b c')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('stripStopwords', () => {
  it('removes market stopwords from a normalized title', () => {
    expect(stripStopwords('vendo nuevo usado seminuevo iphone')).toBe('iphone');
  });

  it('keeps variant and capacity tokens', () => {
    expect(stripStopwords('iphone 13 pro 128gb')).toBe('iphone 13 pro 128gb');
  });
});

describe('extractCapacity', () => {
  it('extracts single capacity in various formats', () => {
    expect(extractCapacity('128gb')).toContain('128gb');
    expect(extractCapacity('128 gb')).toContain('128gb');
    expect(extractCapacity('512 GB')).toContain('512gb');
    expect(extractCapacity('1tb')).toContain('1tb');
  });

  it('extracts ram capacity', () => {
    expect(extractCapacity('8gb ram')).toContain('8gb');
  });
});

describe('extractBrand', () => {
  it('recognizes known brands (case/accent-insensitive)', () => {
    expect(extractBrand('apple')).toBe('apple');
    expect(extractBrand('samsung')).toBe('samsung');
    expect(extractBrand('xiaomi')).toBe('xiaomi');
  });

  it('returns undefined for unknown tokens', () => {
    expect(extractBrand('galaxy')).toBeUndefined();
  });
});

describe('buildCanonicalName', () => {
  it('joins brand and model', () => {
    expect(buildCanonicalName('apple', 'iphone 13')).toBe('apple iphone 13');
  });

  it('returns whichever side exists when the other is missing', () => {
    expect(buildCanonicalName('apple', '')).toBe('apple');
    expect(buildCanonicalName('', 'iphone 13')).toBe('iphone 13');
  });
});

describe('productKey', () => {
  it('normalizes and strips market stopwords', () => {
    expect(productKey('Vendo iPhone 13 Pro 128GB')).toBe('128gb 13 iphone pro');
  });

  it('treats 128gb and 128 GB as the same product', () => {
    expect(productKey('iPhone 13 128gb')).toBe(productKey('iPhone 13 128 GB'));
  });

  it('keeps variant separators (pro vs base)', () => {
    expect(productKey('iPhone 13 Pro')).not.toBe(productKey('iPhone 13'));
  });

  it('keeps the model generation number (13) and variant/capacity', () => {
    const key = productKey('iPhone 13 Pro 128gb');
    expect(key).toContain('13');
    expect(key).toContain('pro');
    expect(key).toContain('128gb');
  });

  it('matches the same model regardless of market phrasing', () => {
    // Misma redacción distinta (mayúsculas/espaciado de capacidad), mismo
    // modelo y capacidad, sin marca -> misma key.
    expect(productKey('Vendo iPhone 13 Pro 128GB')).toBe(
      productKey('iPhone 13 PRO 128 GB')
    );
  });

  it('treats the same model with different capacity as distinct', () => {
    expect(productKey('iPhone 13 128gb')).not.toBe(productKey('iPhone 13 256gb'));
  });

  it('exposes a non-empty stopwords set', () => {
    expect(CATALOG_STOPWORDS.size).toBeGreaterThan(10);
  });
});
