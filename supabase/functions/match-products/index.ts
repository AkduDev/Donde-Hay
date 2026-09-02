/**
 * Dónde Hay - Match Products Edge Function
 * Stub for Fase 4. Receives a scraped product and determines if it matches
 * an existing product in the database.
 *
 * POST /match-products
 * Body: { canonical_name, brand?, model?, category_id? }
 * Returns: { matched: boolean, product_id?: string, confidence?: number }
 *
 * In Fase 4 this will use the same normalize/matching logic from src/lib/
 * (productKey, sameProduct, subsetMatch) ported to Deno.
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";

interface MatchRequest {
  canonical_name: string;
  brand?: string;
  model?: string;
  category_id?: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body: MatchRequest = await req.json();

    if (!body.canonical_name || body.canonical_name.trim().length === 0) {
      return errorResponse("canonical_name is required");
    }

    const admin = getAdminClient();
    const origin = req.headers.get("origin") ?? undefined;
    const name = body.canonical_name.trim().toLowerCase();

    // Fase 4 TODO: port productKey() + subsetMatch() from src/lib/normalize.ts
    // and src/lib/matching.ts to Deno. For now, use simple ILIKE fallback.
    const { data: candidates, error } = await admin
      .from("products")
      .select("id, canonical_name, brand, model")
      .ilike("canonical_name", `%${name}%`)
      .limit(5);

    if (error) {
      console.error("Match query error:", error);
      return errorResponse("Match query failed", 500, error);
    }

    if (!candidates || candidates.length === 0) {
      return jsonResponse(
        { matched: false, product_id: null, confidence: 0 },
        200,
        corsHeaders(origin)
      );
    }

    // Simple exact-match heuristic for the stub
    const exact = candidates.find(
      (c) => c.canonical_name.toLowerCase() === name
    );

    return jsonResponse(
      {
        matched: !!exact,
        product_id: exact?.id ?? candidates[0]?.id ?? null,
        confidence: exact ? 1.0 : 0.5,
        candidates: candidates.map((c) => ({
          id: c.id,
          canonical_name: c.canonical_name,
        })),
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
