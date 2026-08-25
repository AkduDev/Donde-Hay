/**
 * Dónde Hay - Search Products Edge Function
 * Full-text search across products and offers with filters, pagination
 *
 * POST /search-products
 * Body: { query, categoryId?, locationId?, sourceIds?, minPrice?, maxPrice?, sortBy?, cursor?, limit? }
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { optionalAuth } from "../_shared/auth.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";

interface SearchRequest {
  query: string;
  categoryId?: string;
  locationId?: string;
  sourceIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "recent" | "price-asc" | "price-desc";
  cursor?: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user, supabase } = await optionalAuth(req);
    const admin = getAdminClient();
    const origin = req.headers.get("origin") ?? undefined;

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body: SearchRequest = await req.json();

    if (!body.query || body.query.trim().length === 0) {
      return errorResponse("Query is required");
    }

    const limit = Math.min(body.limit ?? 20, 50);
    const query = body.query.trim();

    // ── Build search using Supabase RPC ────────────────────────────
    // We use a two-step approach:
    // 1. Full-text search on products (using pg_trgm or ILIKE for flexible matching)
    // 2. Fetch offers for matched products with filters

    let productQuery = admin
      .from("products")
      .select(
        `
        id, canonical_name, brand, model, description, image_urls, category_id,
        specifications, created_at, updated_at,
        offers:product_offers!product_id(
          id, price, currency, source_id, source_url, source_external_id,
          posted_at, status, location_id, seller_id
        )
      `
      )
      .or(
        `canonical_name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,description.ilike.%${query}%`
      );

    // Apply category filter
    if (body.categoryId) {
      productQuery = productQuery.eq("category_id", body.categoryId);
    }

    // Apply price range filter on offers
    if (body.minPrice !== undefined) {
      productQuery = productQuery.gte("offers.price", body.minPrice);
    }
    if (body.maxPrice !== undefined) {
      productQuery = productQuery.lte("offers.price", body.maxPrice);
    }

    // Apply source filter on offers
    if (body.sourceIds && body.sourceIds.length > 0) {
      productQuery = productQuery.in("offers.source_id", body.sourceIds);
    }

    // Apply location filter on offers
    if (body.locationId) {
      productQuery = productQuery.eq("offers.location_id", body.locationId);
    }

    // Only active offers
    productQuery = productQuery.eq("offers.status", "active");

    // Cursor-based pagination
    if (body.cursor) {
      productQuery = productQuery.gt("created_at", body.cursor);
    }

    // Sort
    switch (body.sortBy) {
      case "price-asc":
        productQuery = productQuery.order("offers.price", {
          foreignTable: "product_offers",
          ascending: true,
        });
        break;
      case "price-desc":
        productQuery = productQuery.order("offers.price", {
          foreignTable: "product_offers",
          ascending: false,
        });
        break;
      default:
        productQuery = productQuery.order("created_at", { ascending: false });
    }

    productQuery = productQuery.limit(limit + 1); // +1 to detect hasNext

    const { data: rawProducts, error: searchError } = await productQuery;

    if (searchError) {
      console.error("Search error:", searchError);
      return errorResponse("Search failed", 500, searchError);
    }

    const hasNext = (rawProducts?.length ?? 0) > limit;
    const products = hasNext ? rawProducts!.slice(0, limit) : rawProducts ?? [];

    // ── Transform: best price per source, compute aggregates ────────
    const transformed = products.map((product) => {
      const activeOffers = (product.offers ?? []).filter(
        (o: Record<string, unknown>) => o.status === "active"
      );

      // Best (lowest) price overall
      const prices = activeOffers.map((o: Record<string, unknown>) => Number(o.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      const averagePrice =
        prices.length > 0
          ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length
          : null;

      // Best offer per source (lowest price per source_id)
      const bestBySource = new Map<string, Record<string, unknown>>();
      for (const offer of activeOffers) {
        const sourceId = offer.source_id as string;
        const existing = bestBySource.get(sourceId);
        if (!existing || Number(offer.price) < Number(existing.price)) {
          bestBySource.set(sourceId, offer);
        }
      }

      const lastSeen = activeOffers.reduce(
        (latest: string, o: Record<string, unknown>) => {
          const posted = o.posted_at as string;
          return posted > latest ? posted : latest;
        },
        ""
      );

      return {
        id: product.id,
        canonicalName: product.canonical_name,
        brand: product.brand,
        model: product.model,
        description: product.description,
        imageUrls: product.image_urls,
        categoryId: product.category_id,
        specifications: product.specifications,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        offers: activeOffers.map((o: Record<string, unknown>) => ({
          id: o.id,
          productId: product.id,
          price: Number(o.price),
          currency: o.currency,
          sourceId: o.source_id,
          sourceUrl: o.source_url,
          sourceExternalId: o.source_external_id,
          postedAt: o.posted_at,
          locationId: o.location_id,
          sellerId: o.seller_id,
        })),
        bestPriceBySource: Object.fromEntries(
          [...bestBySource.entries()].map(([sid, o]) => [
            sid,
            { price: Number(o.price), currency: o.currency, sourceUrl: o.source_url },
          ])
        ),
        minPrice,
        maxPrice,
        averagePrice: averagePrice ? Math.round(averagePrice * 100) / 100 : null,
        offerCount: activeOffers.length,
        availability: {
          available: activeOffers.length > 0,
          lastSeen: lastSeen || product.created_at,
          status: lastSeen ? "recent" : "unknown",
        },
      };
    });

    // Sort by min price if requested (post-transform for price sorts)
    if (body.sortBy === "price-asc") {
      transformed.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    } else if (body.sortBy === "price-desc") {
      transformed.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
    }

    // ── Check if user has favorited any products ─────────────────────
    if (user) {
      const productIds = transformed.map((p) => p.id);
      const { data: favs } = await admin
        .from("favorites")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("type", "product")
        .in("target_id", productIds);

      const favSet = new Set(favs?.map((f) => f.target_id) ?? []);
      for (const p of transformed) {
        p.isFavorite = favSet.has(p.id);
      }
    }

    return jsonResponse(
      {
        products: transformed,
        total: transformed.length,
        hasNext,
        nextCursor: hasNext ? transformed[transformed.length - 1]?.createdAt : null,
        query,
        processingTimeMs: Date.now() - Date.now(), // placeholder
      },
      200,
      corsHeaders(origin)
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Unexpected error:", err);
    return errorResponse("Internal server error", 500);
  }
});
