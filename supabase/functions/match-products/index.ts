/**
 * Dónde Hay - Match Products Edge Function
 * Determines if a scraped product matches an existing one in the database.
 * Uses the same normalize/matching logic as src/lib/normalize.ts + matching.ts.
 *
 * POST /match-products
 * Body: { canonical_name, brand?, model?, category_id? }
 * Returns: { matched, product_id, confidence, candidates }
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";

// ============================================
// NORMALIZE (ported from src/lib/normalize.ts)
// ============================================

const CATALOG_STOPWORDS: ReadonlySet<string> = new Set([
  "nuevo", "usado", "seminuevo", "estrenar", "sellado", "nuevecito",
  "vendo", "vende", "se", "vendedor", "oferta", "rebaja", "urgente",
  "negociable", "negocio", "remato", "venta", "compro", "permuto", "permuta",
  "por motivo de viaje", "motivo de viaje", "por viaje", "viaje",
  "casi nuevo", "con factura", "factura",
  "cuc", "usd", "mlc", "cup", "costo", "precio", "barato",
  "nuevo en caja", "en caja", "original", "garantia", "garantía",
  "libre", "disponible", "vendo original",
]);

const MODEL_VARIANTS: ReadonlySet<string> = new Set([
  "pro", "max", "plus", "mini", "lite", "se", "ultra", "air", "pro max", "promax",
]);

const CAPACITY_REGEX = /(\d+(?:[.,]\d+)?)\s*(gb|tb|go|to)\b/gi;

const ACCENT_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n", ü: "u",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u", Ñ: "n", Ü: "u",
};

function removeAccents(input: string): string {
  return input.split("").map((ch) => ACCENT_MAP[ch] ?? ch).join("");
}

function normalizeTitle(input: string): string {
  return removeAccents(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized.length ? normalized.split(" ") : [];
}

function stripStopwords(normalized: string): string {
  return tokenize(normalized)
    .filter((w) => !CATALOG_STOPWORDS.has(w) && w.length > 1)
    .join(" ");
}

function extractCapacity(normalized: string): string[] {
  const matches = normalized.match(CAPACITY_REGEX);
  if (!matches) return [];
  return matches.map((m) => m.replace(/\s+/g, "").toLowerCase());
}

function productKey(rawTitle: string): string {
  const normalized = stripStopwords(normalizeTitle(rawTitle));
  const tokens = tokenize(normalized);
  const capacitySet = new Set(extractCapacity(normalized));
  const UNITISH = new Set(["gb", "tb", "go", "to"]);

  function isCapacityValue(token: string): boolean {
    if (!/^\d+$/.test(token)) return false;
    for (const cap of capacitySet) {
      if (cap.startsWith(token)) return true;
    }
    return false;
  }

  const keyTokens = tokens.filter((token) => {
    if (capacitySet.has(token)) return false;
    if (UNITISH.has(token)) return false;
    if (isCapacityValue(token)) return false;
    return true;
  });

  return [...keyTokens, ...Array.from(capacitySet)].sort().join(" ");
}

// ============================================
// MATCHING (ported from src/lib/matching.ts)
// ============================================

function similarityScore(a: string, b: string): number {
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

function findVariant(key: string): string | undefined {
  const tokens = tokenize(key);
  for (const variant of MODEL_VARIANTS) {
    if (tokens.includes(variant)) return variant;
  }
  return undefined;
}

function findCapacity(key: string): string | undefined {
  const caps = extractCapacity(key);
  return caps.length > 0 ? caps[0] : undefined;
}

function subsetMatch(keyA: string, keyB: string): boolean {
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

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

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
    const inputKey = productKey(body.canonical_name);

    // Search candidates: ILIKE on canonical_name + brand + model + description
    const searchTerms = [body.canonical_name, body.brand, body.model]
      .filter(Boolean)
      .map((t) => t!.trim())
      .filter((t) => t.length > 0);

    if (searchTerms.length === 0) {
      return jsonResponse(
        { matched: false, product_id: null, confidence: 0, candidates: [] },
        200,
        corsHeaders(origin)
      );
    }

    // Build OR filter for ILIKE across multiple columns
    const orFilters = searchTerms
      .flatMap((term) => [
        `canonical_name.ilike.%${term}%`,
        `brand.ilike.%${term}%`,
        `model.ilike.%${term}%`,
      ])
      .join(",");

    const { data: candidates, error } = await admin
      .from("products")
      .select("id, canonical_name, brand, model")
      .or(orFilters)
      .limit(20);

    if (error) {
      console.error("Match query error:", error);
      return errorResponse("Match query failed", 500, error);
    }

    if (!candidates || candidates.length === 0) {
      return jsonResponse(
        { matched: false, product_id: null, confidence: 0, candidates: [] },
        200,
        corsHeaders(origin)
      );
    }

    // Score each candidate against input
    let bestMatch: { id: string; canonical_name: string; confidence: number } | null = null;

    for (const c of candidates) {
      const candidateKey = productKey(c.canonical_name);

      // Exact key match = highest confidence
      if (candidateKey === inputKey) {
        bestMatch = { id: c.id, canonical_name: c.canonical_name, confidence: 1.0 };
        break;
      }

      // Subset match (variant dura + capacidad blanda)
      if (subsetMatch(inputKey, candidateKey)) {
        const score = similarityScore(inputKey, candidateKey);
        if (!bestMatch || score > bestMatch.confidence) {
          bestMatch = { id: c.id, canonical_name: c.canonical_name, confidence: score };
        }
      }
    }

    // Fallback: if no subsetMatch, try pure similarity with threshold
    if (!bestMatch) {
      for (const c of candidates) {
        const candidateKey = productKey(c.canonical_name);
        const score = similarityScore(inputKey, candidateKey);
        if (score >= 0.7 && (!bestMatch || score > bestMatch.confidence)) {
          bestMatch = { id: c.id, canonical_name: c.canonical_name, confidence: score };
        }
      }
    }

    return jsonResponse(
      {
        matched: !!bestMatch,
        product_id: bestMatch?.id ?? null,
        confidence: bestMatch?.confidence ?? 0,
        input_key: inputKey,
        candidates: candidates.map((c) => ({
          id: c.id,
          canonical_name: c.canonical_name,
          key: productKey(c.canonical_name),
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
