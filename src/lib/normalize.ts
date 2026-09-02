/**
 * Dónde Hay - Normalización de títulos de producto (dominio puro)
 *
 * Lógica reutilizable en la Edge Function `match-products` (Fase 3): normaliza
 * títulos de marketplace (Revolico, 1Cuba, choleslibres, ...) a una forma
 * canónica y limpia para comparar/agrupar productos. Sin I/O.
 */

// ============================================
// Stopwords de mercado (es-CU)
// ============================================

/**
 * Palabras que aportan contexto de mercado pero NO distinguen un producto de
 * otro. Se eliminan de los títulos antes de normalizar/agrupar. Están en
 * singular y sin acentos (se comparan contra el título ya normalizado).
 *
 * Nota: "nuevo"/"usado"/"seminuevo" describen estado, no identidad del producto.
 * Las monedas (cuc/usd/mlc/cup) y términos de venta (vendo/negocio/se vende/
 * urgente/oferta/rebaja) tampoco deben alterar el matching.
 */
export const CATALOG_STOPWORDS: ReadonlySet<string> = new Set([
  // estado / condición
  'nuevo',
  'usado',
  'seminuevo',
  'estrenar',
  'sellado',
  'nuevecito',
  // venta / oferta
  'vendo',
  'vende',
  'se',
  'se vende',
  'vendedor',
  'oferta',
  'rebaja',
  'urgente',
  'negociable',
  'negocio',
  'remato',
  'vendo directo',
  'venta',
  'compro',
  'permuto',
  'permuta',
  // apreciación / contexto
  'por motivo de viaje',
  'motivo de viaje',
  'por viaje',
  'viaje',
  'casi nuevo',
  'con factura',
  'factura',
  // monedas
  'cuc',
  'usd',
  'mlc',
  'cup',
  'costo',
  'precio',
  'barato',
  // genéricos / ruido
  'nuevo en caja',
  'en caja',
  'original',
  'garantia',
  'garantía',
  'libre',
  'disponible',
  'vendo original',
]);

// ============================================
// Tokens discriminantes (variantes + capacidad)
// ============================================

/**
 * Variantes de modelo que SÍ distinguen productos: "iPhone 13" ≠ "iPhone 13 Pro"
 * ≠ "iPhone 13 Pro Max". Se conservan (no son stopwords) y participan en el
 * productKey.
 */
export const MODEL_VARIANTS: ReadonlySet<string> = new Set([
  'pro',
  'max',
  'plus',
  'mini',
  'lite',
  'se',
  'ultra',
  'air',
  'pro max',
  'promax',
]);

/**
 * Patrón para extraer capacidades/almacenamiento (señal discriminante):
 * 128gb, 256 GB, 512 gb, 1tb, 2 tb, 8gb ram, etc.
 */
const CAPACITY_REGEX = /(\d+(?:[.,]\d+)?)\s*(gb|tb|go|to)\b/gi;

// ============================================
// Normalización básica
// ============================================

const ACCENT_MAP: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ñ: 'n',
  ü: 'u',
  Á: 'a',
  É: 'e',
  Í: 'i',
  Ó: 'o',
  Ú: 'u',
  Ñ: 'n',
  Ü: 'u',
};

/**
 * Elimina acentos y diéresis de una cadena (fold a ASCII básico).
 */
export function removeAccents(input: string): string {
  return input
    .split('')
    .map((ch) => ACCENT_MAP[ch] ?? ch)
    .join('');
}

/**
 * Normaliza un título: minúsculas, sin acentos, sin puntuación de mercado
 * (signos, comas, paréntesis, guiones, "x", "/", "·", "–"), colapsa whitespace
 * a un solo espacio y recorta.
 */
export function normalizeTitle(input: string): string {
  return removeAccents(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fracciona un título normalizado en tokens (palabras).
 */
export function tokenize(normalized: string): string[] {
  return normalized.length ? normalized.split(' ') : [];
}

/**
 * Elimina las stopwords de mercado de un título normalizado.
 */
export function stripStopwords(normalized: string): string {
  const words = tokenize(normalized).filter(
    (w) => !CATALOG_STOPWORDS.has(w) && w.length > 1
  );
  return words.join(' ');
}

// ============================================
// Capacidad (almacenamiento / ram)
// ============================================

/**
 * Extrae la(s) capacidad(es) de almacenamiento/ram de un título normalizado
 * (ej. "128gb", "512 gb", "1tb") y las devuelve normalizadas a forma canónica
 * (ej. "128gb", "1tb"). Útil como señal discriminante para el matching.
 */
export function extractCapacity(normalized: string): string[] {
  const matches = normalized.match(CAPACITY_REGEX);
  if (!matches) return [];
  return matches.map((m) => {
    const clean = m.replace(/\s+/g, '').toLowerCase();
    // "128 gb" -> "128gb", "1 tb" -> "1tb"
    return clean;
  });
}

// ============================================
// Marca y modelo
// ============================================

/**
 * Diccionario de marcas conocidas (sin acentos, en minúsculas) para extraer la
 * marca de un título normalizado. Se revisa de mayor a menor precisión (las
 * de dos palabras primero) para evitar falsos positivos.
 */
export const KNOWN_BRANDS: ReadonlySet<string> = new Set([
  'apple',
  'samsung',
  'xiaomi',
  'huawei',
  'honor',
  'oppo',
  'realme',
  'vivo',
  'oneplus',
  'google',
  'motorola',
  'sony',
  'nokia',
  'lg',
  'lenovo',
  'hp',
  'dell',
  'asus',
  'acer',
  'msi',
  'razer',
  'toshiba',
  'fujitsu',
  'panasonic',
  'philips',
  'bosch',
  'siemens',
  'whirlpool',
  'lg',
  'cuban',
  'alcatel',
  'zte',
]);

/**
 * Marca derivada del diccionario, o undefined si no se reconoce ninguna.
 */
export function extractBrand(normalized: string): string | undefined {
  const tokens = tokenize(normalized);
  for (const token of tokens) {
    if (KNOWN_BRANDS.has(token)) {
      return token;
    }
  }
  return undefined;
}

// ============================================
// Nombre canónico
// ============================================

/**
 * Construye el nombre canónico de un producto a partir de marca + modelo
 * (ya normalizados). Si falta alguno, devuelve el que exista.
 */
export function buildCanonicalName(
  brand?: string,
  model?: string
): string {
  const b = (brand ?? '').trim();
  const m = (model ?? '').trim();
  return [b, m].filter(Boolean).join(' ');
}

// ============================================
// ProductKey (matching)
// ============================================

/**
 * Clave canónica para agrupar ofertas del mismo producto.
 *
 * Estrategia (Prioridad 8):
 *  - Normaliza el título y quita stopwords de mercado (vendo/nuevo/usado/...).
 *  - CONSERVA las señales discriminantes: variantes de modelo (pro/max/plus/
 *    mini/lite/se/ultra), capacidades (128gb/512gb/1tb) y números que forman
 *    parte del nombre del modelo (13, 14, 15, s24...).
 *  - Devuelve los tokens ordenados unidos por espacio, en minúsculas.
 *
 * Nota de matching: es un matching conservador — se prefiere NO cruzar productos
 * distintos (falso negativo) antes que agrupar erróneamente (falso positivo).
 * Por eso los números sueltos se conservan (el precio real vive en offer.price,
 * no en el título); solo se absorben las capacidades y se quitan las stopwords.
 *
 * Ej. "Se vende iPhone 13 Pro 128 GB" y "Apple iPhone 13 Pro 128gb" → misma
 *     key "128gb 13 apple iphone pro" (mismo producto).
 */
export function productKey(rawTitle: string): string {
  const normalized = stripStopwords(normalizeTitle(rawTitle));
  const tokens = tokenize(normalized);

  // Capacidades normalizadas y unidas (128gb, 512gb, 1tb). Como pueden venir
  // como "128 gb" / "128gb", se reconstruyen desde el patrón de capacidad.
  const capacitySet = new Set(extractCapacity(normalized));

  // Unidades sueltas (gb/tb) ya absorbidas por capacitySet.
  const UNITISH = new Set(['gb', 'tb', 'go', 'to']);

  // Tokens numéricos que ya representan un valor de capacidad (el "128" de
  // "128 gb") y que quedarían duplicados junto a "128gb" en la key.
  function isCapacityValue(token: string): boolean {
    if (!/^\d+$/.test(token)) return false;
    for (const cap of capacitySet) {
      if (cap.startsWith(token)) return true;
    }
    return false;
  }

  const keyTokens = tokens.filter((token) => {
    if (capacitySet.has(token)) return false;
    if (UNITISH.has(token)) return false; // "gb" de "128 gb"
    if (isCapacityValue(token)) return false; // "128" de "128gb" ya representado
    return true;
  });

  return [...keyTokens, ...Array.from(capacitySet)].sort().join(' ');
}
