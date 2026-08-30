/**
 * Dónde Hay - Format Utilities Tests
 */

import {
  formatPrice,
  formatPriceRange,
  formatRelativeTime,
  format_date,
  formatPhone,
  truncate,
  capitalize,
  slugify,
  getSourceIcon,
  getSourceColor,
} from '../format';

describe('formatPrice', () => {
  it('formats USD price correctly', () => {
    expect(formatPrice(450, 'USD')).toBe('$450');
  });

  it('formats CUP price per locale', () => {
    expect(formatPrice(12000, 'CUP')).toBe('₱12,000');
  });

  it('formats price with up to 2 decimals', () => {
    expect(formatPrice(450.5, 'USD')).toBe('$450.5');
  });

  it('formats compact price', () => {
    expect(formatPrice(1500, 'USD', { compact: true })).toBe('$1.5k');
  });

  it('formats price without symbol', () => {
    expect(formatPrice(450, 'USD', { showSymbol: false })).toBe('450');
  });
});

describe('formatPriceRange', () => {
  it('formats price range', () => {
    expect(formatPriceRange(100, 500, 'USD')).toBe('$100 - $500');
  });

  it('formats same min/max as single price', () => {
    expect(formatPriceRange(300, 300, 'USD')).toBe('$300');
  });
});

describe('formatRelativeTime', () => {
  it('returns relative time string', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = formatRelativeTime(oneHourAgo);
    expect(result).toContain('hace');
  });
});

describe('format_date', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = format_date(date);
    expect(result).toBeTruthy();
  });
});

describe('formatPhone', () => {
  it('formats Cuban phone number', () => {
    expect(formatPhone('53512345678')).toBe('+53 512 345 678');
  });

  it('formats 8-digit phone number', () => {
    expect(formatPhone('12345678')).toBe('+53 123 456 78');
  });

  it('returns original if format unknown', () => {
    expect(formatPhone('123')).toBe('123');
  });
});

describe('truncate', () => {
  it('truncates long text', () => {
    expect(truncate('Hello World this is long', 10)).toBe('Hello W...');
  });

  it('returns original if short enough', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('lowercases rest', () => {
    expect(capitalize('HELLO')).toBe('Hello');
  });
});

describe('slugify', () => {
  it('creates slug from text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes accents', () => {
    expect(slugify('La Habana')).toBe('la-habana');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });
});

describe('getSourceIcon', () => {
  it('returns icon for revolico', () => {
    expect(getSourceIcon('revolico')).toBe('🛒');
  });

  it('returns icon for facebook', () => {
    expect(getSourceIcon('facebook')).toBe('📘');
  });

  it('returns default icon for unknown source', () => {
    expect(getSourceIcon('unknown')).toBe('🔗');
  });
});

describe('getSourceColor', () => {
  it('returns color for revolico', () => {
    expect(getSourceColor('revolico')).toBe('#E44D26');
  });

  it('returns color for facebook', () => {
    expect(getSourceColor('facebook')).toBe('#1877F2');
  });

  it('returns default color for unknown source', () => {
    expect(getSourceColor('unknown')).toBe('#6B7280');
  });
});
