/**
 * Dónde Hay - Matching de productos (dominio puro)
 *
 * Lógica reutilizable en la Edge Function `match-products` (Fase 3): determina
 * si dos ofertas son del mismo producto, las agrega (min/avg/max/availability)
 * y construye la lista de ofertas del detail. Sin I/O.
 */

import {
  productKey,
  tokenize,
  MODEL_VARIANTS,
  extractCapacity,
} from '@/lib/normalize';
import type {
  ProductOffer,
  OfferAggregate,
  OfferListItem,
  ProductWithOffers,
} from '@/types';

// ============================================
// Similitud / mismo producto
// ============================================

/**
 * Similitud de Jaccard entre dos "productKey" (conjuntos de tokens).
 * Devuelve [0, 1]; 1 = misma key exacta.
 */
export function similarityScore(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Determina si dos títulos describen el MISMO producto comparando su productKey.
 * Dos títulos son el mismo producto si comparten todas las señales discriminantes
 * (variante + capacidad) y al menos la marca. Se usa normalmente con umbral de
 * similitud (ver `sameProductThreshold`).
 */
export function sameProduct(rawA: string, rawB: string, threshold = 1): boolean {
  const keyA = productKey(rawA);
  const keyB = productKey(rawB);
  return similarityScore(keyA, keyB) >= threshold;
}

// ============================================
// Disponibilidad
// ============================================

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 7;

/**
 * Deriva el estado de disponibilidad de una lista de ofertas:
 *  - `available`: al menos una oferta activa.
 *  - `lastSeen`: fecha de la oferta más reciente.
 *  - `status`: 'recent' si hay actividad en los últimos 7 días, 'old' si algo
 *    existe pero es antiguo, 'unknown' si no hay ofertas.
 */
export function deriveAvailability(
  offers: ProductOffer[],
  now: number = Date.now()
): OfferAggregate['availability'] {
  if (offers.length === 0) {
    return { available: false, lastSeen: '', status: 'unknown' };
  }
  const active = offers.some((o) => o.status === 'active');
  let lastSeen = 0;
  for (const offer of offers) {
    const t = new Date(offer.postedAt).getTime();
    if (!Number.isNaN(t) && t > lastSeen) lastSeen = t;
  }
  const lastSeenIso = lastSeen ? new Date(lastSeen).toISOString() : '';
  const recent =
    lastSeenIso !== '' &&
    now - new Date(lastSeenIso).getTime() < RECENT_DAYS * DAY_MS;
  return {
    available: active,
    lastSeen: lastSeenIso,
    status: !lastSeenIso ? 'unknown' : recent ? 'recent' : 'old',
  };
}

// ============================================
// Agregación
// ============================================

/**
 * Agrega las ofertas de un MISMO producto: min/max/avg de precio,
 * offerCount, sourceCount, fuentes y disponibilidad. Es el reemplazo puro del
 * cálculo inline que hoy vive duplicado en search.service.ts y products.service.ts.
 */
export function aggregateOffers(
  offers: ProductOffer[],
  now: number = Date.now()
): OfferAggregate {
  const prices = offers
    .map((o) => o.price)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));
  const sourceSet = new Set<string>();
  for (const offer of offers) {
    if (offer.sourceId) sourceSet.add(offer.sourceId);
  }
  const minPrice =
    prices.length > 0 ? Math.min(...prices) : undefined;
  const maxPrice =
    prices.length > 0 ? Math.max(...prices) : undefined;
  const averagePrice =
    prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : undefined;
  return {
    offerCount: offers.length,
    minPrice,
    maxPrice,
    averagePrice,
    sourceCount: sourceSet.size,
    sources: Array.from(sourceSet),
    availability: deriveAvailability(offers, now),
  };
}

// ============================================
// Merge
// ============================================

/**
 * Determina si dos keys describen el MISMO producto por subconjunto de tokens.
 *
 * Estrategia (Prioridad 8):
 *  - **Variante (dura)**: si una key dice "pro" y otra no (o dice otra), NO son
 *    el mismo producto ("iPhone 13" ≠ "iPhone 13 Pro").
 *  - **Capacidad (debe coincidir si ambas la declaran)**: "128gb" vs "256gb"
 *    no agrupan, pero "128gb" vs "sin capacidad" sí (el título puede omitirla).
 *  - **Resto (blando)**: marca/modelo/otros pueden subconjuntarse ("iPhone 13"
 *    ⊆ "iPhone 13 128gb").
 */
export function subsetMatch(keyA: string, keyB: string): boolean {
  const variantA = findVariant(keyA);
  const variantB = findVariant(keyB);
  if (variantA !== variantB) return false;

  const capA = findCapacity(keyA);
  const capB = findCapacity(keyB);
  if (capA && capB && capA !== capB) return false;

  const setA = new Set(tokenize(keyA));
  const setB = new Set(tokenize(keyB));
  if (setA.size === 0 || setB.size === 0) return false;

  let contained = true;
  for (const token of setA) {
    if (!setB.has(token)) {
      contained = false;
      break;
    }
  }
  if (contained) return true;
  for (const token of setB) {
    if (!setA.has(token)) return false;
  }
  return true;
}

/**
 * Devuelve la variante de modelo presente en una key (ej. "pro", "max"), o
 * undefined si no hay ninguna.
 */
function findVariant(key: string): string | undefined {
  const tokens = tokenize(key);
  for (const variant of MODEL_VARIANTS) {
    if (tokens.includes(variant)) return variant;
  }
  return undefined;
}

/**
 * Devuelve la capacidad (128gb/256gb/1tb...) presente en una key, o undefined.
 */
function findCapacity(key: string): string | undefined {
  const caps = extractCapacity(key);
  return caps.length > 0 ? caps[0] : undefined;
}

/**
 * Mezcla dos listas de productos agrupándolos por similitud de key (subconjunto).
 * Los que ya existen se fusionan (sumando ofertas) y los nuevos se añaden. Usa
 * `offers` como única fuente de verdad y recalcula los agregados con
 * `aggregateOffers`. La lista resultante mantiene el mismo orden que `base`.
 */
export function mergeByKey(
  base: ProductWithOffers[],
  incoming: ProductWithOffers[]
): ProductWithOffers[] {
  const merged: ProductWithOffers[] = base.map((product) => ({
    ...product,
    offers: [...product.offers],
  }));

  for (const candidate of incoming) {
    if (candidate.offers.length === 0) continue;
    const candidateKey = productKey(candidate.canonicalName);
    let existing: ProductWithOffers | undefined;
    for (const product of merged) {
      const key = productKey(product.canonicalName);
      if (subsetMatch(key, candidateKey)) {
        existing = product;
        break;
      }
    }
    if (existing) {
      existing.offers.push(...candidate.offers);
    } else {
      merged.push({ ...candidate, offers: [...candidate.offers] });
    }
  }

  for (const product of merged) {
    applyAggregate(product);
  }

  return merged;
}

/**
 * Aplica los agregados calculados (`aggregateOffers`) sobre un producto
 * `ProductWithOffers`, actualizando minPrice/maxPrice/averagePrice/offerCount,
 * fuentes y availability.
 */
export function applyAggregate(
  product: ProductWithOffers,
  now: number = Date.now()
): ProductWithOffers {
  const agg = aggregateOffers(product.offers, now);
  product.minPrice = agg.minPrice;
  product.maxPrice = agg.maxPrice;
  product.averagePrice = agg.averagePrice;
  product.offerCount = agg.offerCount;
  product.availability = agg.availability;
  return product;
}

// ============================================
// Offer list (detail)
// ============================================

/**
 * Construye la lista de ofertas del DETAIL ordenada por precio ascendente
 * (contrato Prioridad 5, OfferListItem).
 */
export function buildOfferList(
  product: ProductWithOffers,
  names?: { sources?: Record<string, string>; sellers?: Record<string, string> }
): OfferListItem[] {
  const sources = names?.sources ?? {};
  const sellers = names?.sellers ?? {};
  return product.offers
    .map((offer) => ({
      offerId: offer.id,
      price: offer.price,
      currency: offer.currency,
      sourceId: offer.sourceId,
      sourceName: sources[offer.sourceId] ?? offer.sourceId,
      sourceUrl: offer.sourceUrl,
      sellerName: offer.sellerId ? sellers[offer.sellerId] : undefined,
      postedAt: offer.postedAt,
      status: offer.status,
    }))
    .sort((a, b) => a.price - b.price);
}
