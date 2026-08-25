/**
 * Dónde Hay - Shared Revolico Utilities
 * Normalization, mappings, and helpers for Revolico scraping
 * Used by Edge Functions (Deno runtime)
 */

// ============================================
// REVOLICO AD SHAPE (from GraphQL)
// ============================================

export interface RevolicoPhone {
  prefix: string;
  number: string;
  type: string;
  isWhatsapp: boolean;
}

export interface RevolicoAd {
  id: string;
  title: string;
  price: number;
  currency: string;
  permalink: string;
  imagesCount: number;
  mainImage: { gcsKey: string } | null;
  phoneInfo: {
    firstPhone: RevolicoPhone | null;
    secondPhone: RevolicoPhone | null;
  };
  provinceId: string;
  municipalityId: string;
  viewCount: number;
  updatedOnToOrder: string;
  isPromoted: boolean;
  contactInfo: string;
}

// ============================================
// CONSTANTS
// ============================================

const REVOLICO_IMAGE_BASE = "https://pic.revolico.com/";
const REVOLICO_SITE_BASE = "https://www.revolico.com";

/** Revolico category ID → our category slug */
export const REVOLICO_CATEGORY_MAP: Record<string, string> = {
  "1000": "vehiculos",
  "1100": "inmobiliaria",
  "1200": "tecnologia",
  "1300": "electrodomesticos",
  "1400": "otros",
  "1001": "vehiculos-carros",
  "1002": "vehiculos-camiones",
  "1003": "vehiculos-motos",
  "1004": "vehiculos-accesorios",
  "1005": "vehiculos-parts",
  "1006": "vehiculos-buses",
  "1007": "vehiculos-trailers",
  "1008": "vehiculos-otros",
  "1101": "inmobiliaria-venta",
  "1102": "inmobiliaria-alquiler",
  "1103": "inmobiliaria-habitaciones",
  "1104": "inmobiliaria-terrenos",
  "1105": "inmobiliaria-oficinas",
  "1106": "inmobiliaria-otros",
  "1201": "tecnologia-computadoras",
  "1202": "tecnologia-telefonos",
  "1203": "tecnologia-tablets",
  "1204": "tecnologia-accesorios",
  "1205": "tecnologia-gaming",
  "1206": "tecnologia-redes",
  "1207": "tecnologia-impresoras",
  "1208": "tecnologia-camaras",
  "1209": "tecnologia-audio",
  "1210": "tecnologia-otros",
  "1301": "electrodomesticos-cocina",
  "1302": "electrodomesticos-lavado",
  "1303": "electrodomesticos-clima",
  "1304": "electrodomesticos-refrigeracion",
  "1305": "electrodomesticos-entretenimiento",
  "1306": "electrodomesticos-hogar",
  "1307": "electrodomesticos-otros",
  "1401": "otros-mascotas",
  "1402": "otros-deportes",
  "1403": "otros-hogar",
  "1404": "otros-ropa",
  "1405": "otros-belleza",
  "1406": "otros-libros",
  "1407": "otros-musica",
  "1408": "otros-otros",
};

/** Revolico province ID → our province name */
export const REVOLICO_PROVINCE_MAP: Record<string, string> = {
  "1": "La Habana",
  "2": "Artemisa",
  "3": "Mayabeque",
  "4": "Pinar del Río",
  "5": "Matanzas",
  "6": "Cienfuegos",
  "7": "Villa Clara",
  "8": "Sancti Spíritus",
  "9": "Ciego de Ávila",
  "10": "Camagüey",
  "11": "Las Tunas",
  "12": "Granma",
  "13": "Holguín",
  "14": "Santiago de Cuba",
  "15": "Guantánamo",
  "16": "Isla de la Juventud",
};

const VALID_CURRENCIES = new Set(["USD", "CUP", "MLC"]);

// ============================================
// HELPERS
// ============================================

/** Build full image URL from Revolico gcsKey */
export function buildImageUrl(gcsKey: string): string {
  if (gcsKey.startsWith("http")) return gcsKey;
  return `${REVOLICO_IMAGE_BASE}${gcsKey}`;
}

/** Build the Revolico permalink URL */
export function buildPermalinkUrl(permalink: string): string {
  if (permalink.startsWith("http")) return permalink;
  return `${REVOLICO_SITE_BASE}${permalink}`;
}

/** Normalize currency string to valid enum value */
function normalizeCurrency(currency: string): "USD" | "CUP" | "MLC" {
  const upper = currency.toUpperCase();
  if (VALID_CURRENCIES.has(upper)) return upper as "USD" | "CUP" | "MLC";
  return "USD";
}

/** Parse a Revolico title into brand + model hints */
function parseTitle(title: string): { brand: string; model: string } {
  const words = title.trim().split(/\s+/);
  const brand = words[0]?.toUpperCase() ?? "";
  const model = words.slice(1, 4).join(" ");
  return { brand, model };
}

/** Build a canonical product name from a Revolico ad title */
function buildCanonicalName(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generate a deterministic ID from Revolico ad id */
function offerExternalId(revolicoAdId: string, sourceId: string): string {
  return `${sourceId}:${revolicoAdId}`;
}

// ============================================
// NORMALIZATION FUNCTIONS
// ============================================

/**
 * Convert a Revolico ad into our `products` table row shape.
 * The product represents the *canonical* item; offers are individual listings.
 */
export function revolicoAdToProduct(
  ad: RevolicoAd,
  categoryId?: string
): {
  canonical_name: string;
  brand: string;
  model: string;
  category_id: string | null;
  description: string;
  image_urls: string[];
  specifications: Record<string, unknown>;
} {
  const { brand, model } = parseTitle(ad.title);
  const categorySlug = REVOLICO_CATEGORY_MAP[categoryId ?? ""] ?? null;

  const imageUrls: string[] = [];
  if (ad.mainImage?.gcsKey) {
    imageUrls.push(buildImageUrl(ad.mainImage.gcsKey));
  }

  return {
    canonical_name: buildCanonicalName(ad.title),
    brand,
    model: model || ad.title,
    category_id: categorySlug,
    description: ad.title,
    image_urls: imageUrls,
    specifications: {
      revolicoViews: ad.viewCount,
      revolicoPromoted: ad.isPromoted,
      imagesCount: ad.imagesCount,
    },
  };
}

/**
 * Convert a Revolico ad into our `product_offers` table row shape.
 */
export function revolicoAdToOffer(
  ad: RevolicoAd,
  productId: string,
  sellerId: string
): {
  product_id: string;
  seller_id: string;
  source_id: string;
  price: number;
  currency: "USD" | "CUP" | "MLC";
  location_id: string;
  source_url: string;
  source_external_id: string;
  posted_at: string;
  status: "active" | "inactive" | "sold";
  raw_data: Record<string, unknown>;
} {
  return {
    product_id: productId,
    seller_id: sellerId,
    source_id: "revolico",
    price: ad.price,
    currency: normalizeCurrency(ad.currency),
    location_id: ad.provinceId,
    source_url: buildPermalinkUrl(ad.permalink),
    source_external_id: offerExternalId(ad.id, "revolico"),
    posted_at: ad.updatedOnToOrder || new Date().toISOString(),
    status: "active",
    raw_data: {
      revolicoId: ad.id,
      provinceId: ad.provinceId,
      municipalityId: ad.municipalityId,
      viewCount: ad.viewCount,
      contactInfo: ad.contactInfo,
      imagesCount: ad.imagesCount,
    },
  };
}

/**
 * Convert a Revolico ad into our `sellers` table row shape.
 */
export function revolicoAdToSeller(
  ad: RevolicoAd
): {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  source_id: string;
  source_profile_url: string | null;
  location_id: string;
  verification_status: "none";
} {
  const phone1 = ad.phoneInfo?.firstPhone;
  const phone2 = ad.phoneInfo?.secondPhone;

  let phone: string | null = null;
  let whatsapp: string | null = null;

  if (phone1) {
    const fullNumber = `${phone1.prefix}${phone1.number}`;
    if (phone1.isWhatsapp) {
      whatsapp = fullNumber;
    } else {
      phone = fullNumber;
    }
  }

  if (phone2) {
    const fullNumber = `${phone2.prefix}${phone2.number}`;
    if (phone2.isWhatsapp && !whatsapp) {
      whatsapp = fullNumber;
    } else if (!phone) {
      phone = fullNumber;
    }
  }

  const provinceName = REVOLICO_PROVINCE_MAP[ad.provinceId] ?? "";

  return {
    name: `Revolico Seller ${ad.id}`,
    phone,
    whatsapp,
    source_id: "revolico",
    source_profile_url: `${REVOLICO_SITE_BASE}${ad.permalink}`,
    location_id: provinceName,
    verification_status: "none",
  };
}

/**
 * Build a dedup key for products based on canonical name.
 */
export function productDedupKey(title: string): string {
  return buildCanonicalName(title);
}

/**
 * Batch an array into chunks of `size`.
 */
export function batch<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
