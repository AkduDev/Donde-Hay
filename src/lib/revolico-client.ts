/**
 * Dónde Hay - Revolico GraphQL Client
 * Client for Revolico's internal GraphQL API
 */

// ============================================
// TYPES
// ============================================

export interface RevolicoAdImage {
  gcsKey: string;
}

export interface RevolicoPhone {
  prefix: string;
  number: string;
  type: string;
  isWhatsapp: boolean;
}

export interface RevolicoPhoneInfo {
  firstPhone: RevolicoPhone | null;
  secondPhone: RevolicoPhone | null;
}

export interface RevolicoAd {
  id: string;
  title: string;
  price: number;
  currency: string;
  permalink: string;
  imagesCount: number;
  mainImage: RevolicoAdImage | null;
  phoneInfo: RevolicoPhoneInfo;
  provinceId: string;
  municipalityId: string;
  viewCount: number;
  updatedOnToOrder: string;
  isPromoted: boolean;
  contactInfo: string;
}

export interface RevolicoAdConnection {
  edges: Array<{
    node: RevolicoAd;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface RevolicoAdsResponse {
  ads: RevolicoAdConnection;
}

export interface RevolicoAdDetailResponse {
  ad: RevolicoAd | null;
}

export interface RevolicoScrapeOptions {
  categoryId: string;
  after?: string;
  limit?: number;
}

export interface RevolicoScrapeResult {
  ads: RevolicoAd[];
  hasNextPage: boolean;
  endCursor: string | null;
}

// ============================================
// CATEGORY MAPPING
// ============================================

/** Revolico category ID → Dónde Hay category slug */
export const REVOLICO_CATEGORY_MAP: Record<string, string> = {
  // Root categories
  '1000': 'vehiculos',
  '1100': 'inmobiliaria',
  '1200': 'tecnologia',
  '1300': 'electrodomesticos',
  '1400': 'otros',
  // Vehículos subcategories
  '1001': 'vehiculos-carros',
  '1002': 'vehiculos-camiones',
  '1003': 'vehiculos-motos',
  '1004': 'vehiculos-accesorios',
  '1005': 'vehiculos-parts',
  '1006': 'vehiculos-buses',
  '1007': 'vehiculos-trailers',
  '1008': 'vehiculos-otros',
  // Inmobiliaria subcategories
  '1101': 'inmobiliaria-venta',
  '1102': 'inmobiliaria-alquiler',
  '1103': 'inmobiliaria-habitaciones',
  '1104': 'inmobiliaria-terrenos',
  '1105': 'inmobiliaria-oficinas',
  '1106': 'inmobiliaria-otros',
  // Tecnología subcategories
  '1201': 'tecnologia-computadoras',
  '1202': 'tecnologia-telefonos',
  '1203': 'tecnologia-tablets',
  '1204': 'tecnologia-accesorios',
  '1205': 'tecnologia-gaming',
  '1206': 'tecnologia-redes',
  '1207': 'tecnologia-impresoras',
  '1208': 'tecnologia-camaras',
  '1209': 'tecnologia-audio',
  '1210': 'tecnologia-otros',
  // Electrodomésticos subcategories
  '1301': 'electrodomesticos-cocina',
  '1302': 'electrodomesticos-lavado',
  '1303': 'electrodomesticos-clima',
  '1304': 'electrodomesticos-refrigeracion',
  '1305': 'electrodomesticos-entretenimiento',
  '1306': 'electrodomesticos-hogar',
  '1307': 'electrodomesticos-otros',
  // Otros subcategories
  '1401': 'otros-mascotas',
  '1402': 'otros-deportes',
  '1403': 'otros-hogar',
  '1404': 'otros-ropa',
  '1405': 'otros-belleza',
  '1406': 'otros-libros',
  '1407': 'otros-musica',
  '1408': 'otros-otros',
};

/** Dónde Hay category slug → Revolico category ID (reverse map) */
export const SLUG_TO_REVOLICO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(REVOLICO_CATEGORY_MAP).map(([id, slug]) => [slug, id])
);

// ============================================
// GRAPHQL QUERIES
// ============================================

const ADS_QUERY = `
  query SearchAds($category: String!, $after: String) {
    ads(category: $category, after: $after) {
      edges {
        node {
          id
          title
          price
          currency
          permalink
          imagesCount
          mainImage { gcsKey }
          phoneInfo {
            firstPhone { prefix number type isWhatsapp }
            secondPhone { prefix number type isWhatsapp }
          }
          provinceId
          municipalityId
          viewCount
          updatedOnToOrder
          isPromoted
          contactInfo
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const AD_DETAIL_QUERY = `
  query GetAd($id: ID!) {
    ad(id: $id) {
      id
      title
      price
      currency
      permalink
      imagesCount
      mainImage { gcsKey }
      phoneInfo {
        firstPhone { prefix number type isWhatsapp }
        secondPhone { prefix number type isWhatsapp }
      }
      provinceId
      municipalityId
      viewCount
      updatedOnToOrder
      isPromoted
      contactInfo
    }
  }
`;

// ============================================
// CLIENT
// ============================================

const REVOLICO_GRAPHQL_ENDPOINT = 'https://graphql-api.revolico.app/';
const REVOLICO_IMAGE_BASE = 'https://pic.revolico.com/';
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Origin': 'https://www.revolico.com',
  'Referer': 'https://www.revolico.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const REQUEST_TIMEOUT = 15000;

/** Delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Build full image URL from Revolico gcsKey */
export function buildRevolicoImageUrl(gcsKey: string): string {
  if (gcsKey.startsWith('http')) return gcsKey;
  return `${REVOLICO_IMAGE_BASE}${gcsKey}`;
}

/**
 * Execute a GraphQL request against Revolico's API
 */
async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(REVOLICO_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new RevolicoRateLimitError('Rate limited by Revolico');
    }

    if (!response.ok) {
      throw new RevolicoClientError(
        `Revolico API returned ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      throw new RevolicoClientError(
        `GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }

    if (!json.data) {
      throw new RevolicoClientError('Empty response from Revolico API', 500);
    }

    return json.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof RevolicoClientError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new RevolicoClientError('Request to Revolico timed out', 408);
    }

    throw new RevolicoClientError(
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Fetch ads from a Revolico category with cursor pagination
 */
export async function searchByCategory(
  options: RevolicoScrapeOptions
): Promise<RevolicoScrapeResult> {
  const { categoryId, after, limit = 20 } = options;

  const data = await gqlRequest<RevolicoAdsResponse>(ADS_QUERY, {
    category: categoryId,
    after: after ?? null,
  });

  const ads = data.ads.edges.map((edge) => edge.node);

  return {
    ads: ads.slice(0, limit),
    hasNextPage: data.ads.pageInfo.hasNextPage,
    endCursor: data.ads.pageInfo.endCursor,
  };
}

/**
 * Fetch all pages from a category (up to maxPages)
 */
export async function searchByCategoryAll(
  categoryId: string,
  maxPages: number = 5,
  delayMs: number = 500
): Promise<RevolicoAd[]> {
  const allAds: RevolicoAd[] = [];
  let cursor: string | undefined;
  let hasNext = true;
  let pageCount = 0;

  while (hasNext && pageCount < maxPages) {
    const result = await searchByCategory({ categoryId, after: cursor });
    allAds.push(...result.ads);
    hasNext = result.hasNextPage;
    cursor = result.endCursor ?? undefined;
    pageCount++;

    if (hasNext && pageCount < maxPages) {
      await delay(delayMs);
    }
  }

  return allAds;
}

/**
 * Fetch a single ad's details
 */
export async function getAdDetail(adId: string): Promise<RevolicoAd | null> {
  const data = await gqlRequest<RevolicoAdDetailResponse>(AD_DETAIL_QUERY, {
    id: adId,
  });
  return data.ad;
}

/**
 * Search across multiple categories
 */
export async function searchMultipleCategories(
  categoryIds: string[],
  maxPagesPerCategory: number = 3
): Promise<RevolicoAd[]> {
  const allAds: RevolicoAd[] = [];

  for (const catId of categoryIds) {
    const ads = await searchByCategoryAll(catId, maxPagesPerCategory);
    allAds.push(...ads);
    await delay(800);
  }

  return allAds;
}

// ============================================
// ERRORS
// ============================================

export class RevolicoClientError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'RevolicoClientError';
    this.statusCode = statusCode;
  }
}

export class RevolicoRateLimitError extends RevolicoClientError {
  constructor(message: string = 'Rate limited') {
    super(message, 429);
    this.name = 'RevolicoRateLimitError';
  }
}
