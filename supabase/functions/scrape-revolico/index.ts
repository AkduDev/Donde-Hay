/**
 * Dónde Hay - Scrape Revolico Edge Function
 * Fetches ads from Revolico GraphQL API, normalizes, and upserts into Supabase
 *
 * POST /scrape-revolico
 * Body: { categoryId?: string, search?: string, limit?: number }
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";
import {
  REVOLICO_CATEGORY_MAP,
  revolicoAdToProduct,
  revolicoAdToOffer,
  revolicoAdToSeller,
  productDedupKey,
  batch,
  type RevolicoAd,
} from "../_shared/revolico.ts";

// ============================================
// REVOLICO GRAPHQL CLIENT (inline for Deno)
// ============================================

const GRAPHQL_ENDPOINT = "https://graphql-api.revolico.app/";
const IMAGE_BASE = "https://pic.revolico.com/";
const SITE_BASE = "https://www.revolico.com";

const GQL_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Origin: "https://www.revolico.com",
  Referer: "https://www.revolico.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const ADS_QUERY = `
  query SearchAds($category: String!, $after: String) {
    ads(category: $category, after: $after) {
      edges {
        node {
          id title price currency permalink imagesCount
          mainImage { gcsKey }
          phoneInfo {
            firstPhone { prefix number type isWhatsapp }
            secondPhone { prefix number type isWhatsapp }
          }
          provinceId municipalityId viewCount updatedOnToOrder
          isPromoted contactInfo
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

interface GqlAdsResponse {
  data: {
    ads: {
      edges: Array<{ node: RevolicoAd; cursor: string }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
}

async function gqlFetch(categoryId: string, after?: string): Promise<GqlAdsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: GQL_HEADERS,
      body: JSON.stringify({ query: ADS_QUERY, variables: { category: categoryId, after: after ?? null } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Revolico API ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ============================================
// SCRAPE LOGIC
// ============================================

interface ScrapeRequest {
  categoryId?: string;
  search?: string;
  limit?: number;
}

/** Upsert products, offers, and sellers for a batch of Revolico ads */
async upsertBatch(
  admin: ReturnType<typeof getAdminClient>,
  ads: RevolicoAd[],
  categoryId?: string
): Promise<{ products: number; offers: number; sellers: number }> {
  let productCount = 0;
  let offerCount = 0;
  let sellerCount = 0;

  if (ads.length === 0) return { products: 0, offers: 0, sellers: 0 };

  // 1. Normalize all ads
  const normalizedProducts = ads.map((ad) => ({
    ...revolicoAdToProduct(ad, categoryId),
    _revolicoId: ad.id,
    _ad: ad,
  }));

  // 2. Dedup products by canonical_name
  const seen = new Map<string, (typeof normalizedProducts)[0]>();
  for (const p of normalizedProducts) {
    const key = productDedupKey(p.canonical_name);
    if (!seen.has(key)) {
      seen.set(key, p);
    }
  }
  const uniqueProducts = [...seen.values()];

  // 3. Upsert products in batches
  const productBatches = batch(uniqueProducts, 50);
  const upsertedProducts: Array<{ id: string; canonical_name: string }> = [];

  for (const pBatch of productBatches) {
    const rows = pBatch.map((p) => ({
      canonical_name: p.canonical_name,
      brand: p.brand,
      model: p.model,
      category_id: p.category_id,
      description: p.description,
      image_urls: p.image_urls,
      specifications: p.specifications,
    }));

    const { data, error } = await admin
      .from("products")
      .upsert(rows, {
        onConflict: "canonical_name",
        ignoreDuplicates: false,
      })
      .select("id, canonical_name");

    if (error) {
      console.error("Product upsert error:", error);
      continue;
    }
    upsertedProducts.push(...(data ?? []));
    productCount += (data ?? []).length;
  }

  // Build lookup: canonical_name → product id
  const nameToId = new Map<string, string>();
  for (const p of upsertedProducts) {
    nameToId.set(p.canonical_name, p.id);
  }

  // 4. Upsert sellers and prepare offers
  const sellerMap = new Map<string, RevolicoAd>();
  for (const ad of ads) {
    const sellerKey = `revolico:${ad.id}`;
    if (!sellerMap.has(sellerKey)) {
      sellerMap.set(sellerKey, ad);
    }
  }

  const sellerRows = [...sellerMap.values()].map((ad) => revolicoAdToSeller(ad));
  const sellerBatches = batch(sellerRows, 50);
  const upsertedSellers: Array<{ id: string; source_profile_url: string }> = [];

  for (const sBatch of sellerBatches) {
    const { data, error } = await admin
      .from("sellers")
      .upsert(sBatch, {
        onConflict: "source_id,source_profile_url",
        ignoreDuplicates: false,
      })
      .select("id, source_profile_url");

    if (error) {
      console.error("Seller upsert error:", error);
      continue;
    }
    upsertedSellers.push(...(data ?? []));
    sellerCount += (data ?? []).length;
  }

  // Build lookup: source_profile_url → seller id
  const sellerUrlToId = new Map<string, string>();
  for (const s of upsertedSellers) {
    sellerUrlToId.set(s.source_profile_url ?? "", s.id);
  }

  // 5. Upsert offers
  const offerRows: Array<ReturnType<typeof revolicoAdToOffer>> = [];
  for (const ad of ads) {
    const canonicalKey = productDedupKey(revolicoAdToProduct(ad, categoryId).canonical_name);
    const productId = nameToId.get(canonicalKey);
    if (!productId) continue;

    const sellerUrl = `${SITE_BASE}${ad.permalink}`;
    const sellerId = sellerUrlToId.get(sellerUrl) ?? "";

    const offer = revolicoAdToOffer(ad, productId, sellerId || "unknown");
    offerRows.push(offer);
  }

  const offerBatches = batch(offerRows, 50);
  for (const oBatch of offerBatches) {
    const { data, error } = await admin
      .from("product_offers")
      .upsert(oBatch, {
        onConflict: "source_external_id",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.error("Offer upsert error:", error);
      continue;
    }
    offerCount += (data ?? []).length;
  }

  return { products: productCount, offers: offerCount, sellers: sellerCount };
}

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body: ScrapeRequest = await req.json();
    const { categoryId, search, limit = 50 } = body;

    if (!categoryId && !search) {
      return errorResponse("Either categoryId or search is required");
    }

    const admin = getAdminClient();
    const startTime = Date.now();

    // Determine category IDs to scrape
    let categoryIds: string[] = [];

    if (categoryId) {
      categoryIds = [categoryId];
    } else if (search) {
      // Map search term to category IDs
      const searchLower = search.toLowerCase();
      for (const [id, slug] of Object.entries(REVOLICO_CATEGORY_MAP)) {
        if (slug.includes(searchLower) || searchLower.includes(slug.split("-")[0] ?? "")) {
          categoryIds.push(id);
        }
      }
      // If no categories matched, try the first root category as fallback
      if (categoryIds.length === 0) {
        categoryIds = ["1200"]; // Tecnología as default
      }
    }

    // Fetch ads from all matched categories
    const allAds: RevolicoAd[] = [];
    let lastCursor: string | null = null;

    for (const catId of categoryIds) {
      const maxPages = 3;
      let cursor: string | undefined;
      let hasNext = true;
      let pageCount = 0;

      while (hasNext && pageCount < maxPages && allAds.length < limit) {
        try {
          const data = await gqlFetch(catId, cursor);
          const ads = data.data.ads.edges.map((e) => e.node);
          allAds.push(...ads);
          hasNext = data.data.ads.pageInfo.hasNextPage;
          cursor = data.data.ads.pageInfo.endCursor ?? undefined;
          lastCursor = data.data.ads.pageInfo.endCursor;
          pageCount++;
        } catch (err) {
          console.error(`Error fetching category ${catId} page ${pageCount}:`, err);
          break;
        }

        // Rate limit between pages
        if (hasNext && pageCount < maxPages) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    const fetchedAds = allAds.slice(0, limit);

    if (fetchedAds.length === 0) {
      return jsonResponse(
        {
          message: "No ads found",
          ads: [],
          stats: { products: 0, offers: 0, sellers: 0 },
          durationMs: Date.now() - startTime,
        },
        200,
        corsHeaders(req.headers.get("origin") ?? undefined)
      );
    }

    // Upsert into Supabase
    const stats = await upsertBatch(admin, fetchedAds, categoryIds[0]);

    return jsonResponse(
      {
        message: `Scraped ${fetchedAds.length} ads`,
        stats,
        adsCount: fetchedAds.length,
        categoriesScraped: categoryIds,
        hasMore: allAds.length > limit,
        nextCursor: lastCursor,
        durationMs: Date.now() - startTime,
      },
      200,
      corsHeaders(req.headers.get("origin") ?? undefined)
    );
  } catch (err) {
    console.error("scrape-revolico error:", err);
    return errorResponse("Internal server error", 500);
  }
});
