/**
 * Dónde Hay - Formatting Utilities
 * Formateo de precios, fechas, teléfonos y textos
 */

type Currency = 'USD' | 'CUP' | 'MLC';

// ============================================
// PRECIOS
// ============================================

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  CUP: '₱',
  MLC: 'M',
};

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  CUP: 'es-CU',
  MLC: 'es-CU',
};

export function formatPrice(
  amount: number,
  currency: Currency = 'USD',
  options?: { showSymbol?: boolean; compact?: boolean }
): string {
  const { showSymbol = true, compact = false } = options ?? {};
  const symbol = CURRENCY_SYMBOLS[currency];
  const locale = CURRENCY_LOCALES[currency];

  if (compact && amount >= 1000) {
    const compactAmount = amount / 1000;
    return `${symbol}${compactAmount.toFixed(1)}k`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `${symbol}${formatted}` : formatted;
}

export function formatPriceRange(
  min: number,
  max: number,
  currency: Currency = 'USD'
): string {
  if (min === max) {
    return formatPrice(min, currency);
  }
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

// ============================================
// FECHAS
// ============================================

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Infinity, unit: 'years' },
];

const rtf = new Intl.RelativeTimeFormat('es-CU', { numeric: 'auto' });

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  let duration = (target.getTime() - now.getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return format_date(date);
}

export function format_date(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-CU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isRecent(date: string | Date, hoursThreshold: number = 24): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= hoursThreshold;
}

// ============================================
// TELÉFONOS
// ============================================

export function formatPhone(phone: string): string {
  // Cuba: +53 XXX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('53') && cleaned.length === 11) {
    return `+53 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  if (cleaned.length === 8) {
    return `+53 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
}

export function formatWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('53')) {
    return `https://wa.me/${cleaned}`;
  }
  
  return `https://wa.me/53${cleaned}`;
}

// ============================================
// TEXTOS
// ============================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================
// FUENTES (Sources)
// ============================================

const SOURCE_ICONS: Record<string, string> = {
  revolico: '🛒',
  '1cuba': '🏪',
  choleslibres: '🏷️',
  facebook: '📘',
  instagram: '📸',
  telegram: '💬',
  comunidad: '👥',
};

export function getSourceIcon(sourceId: string): string {
  return SOURCE_ICONS[sourceId] ?? '🔗';
}

export function getSourceColor(sourceId: string): string {
  const colors: Record<string, string> = {
    revolico: '#E44D26',
    '1cuba': '#1877F2',
    choleslibres: '#25D366',
    facebook: '#1877F2',
    instagram: '#E4405F',
    telegram: '#0088CC',
    comunidad: '#2563EB',
  };
  return colors[sourceId] ?? '#6B7280';
}
