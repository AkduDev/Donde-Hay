/**
 * Dónde Hay - Scrape Sources Edge Function
 * Stub/skeleton for future web scraping integration.
 * Currently logs what would be scraped and tracks jobs.
 *
 * POST /scrape-sources
 * Body: { sources?: string[], categories?: string[] }
 */

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";

const SUPPORTED_SOURCES = [
  "revolico",
  "1cuba",
  "choleslibres",
  "facebook",
  "instagram",
  "telegram",
] as const;

type SourceSlug = (typeof SUPPORTED_SOURCES)[number];

interface ScrapeRequest {
  sources?: SourceSlug[];
  categories?: string[];
  dryRun?: boolean;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const admin = getAdminClient();
    const body: ScrapeRequest = await req.json();

    const sourcesToScrape =
      body.sources && body.sources.length > 0
        ? body.sources.filter((s): s is SourceSlug =>
            SUPPORTED_SOURCES.includes(s as SourceSlug)
          )
        : [...SUPPORTED_SOURCES];

    // ── 1. Create scrape_jobs entries ─────────────────────────────────
    const scrapeJobs: Array<{
      source_id: string;
      status: string;
      categories: string[];
      started_at: string;
    }> = [];

    for (const source of sourcesToScrape) {
      const job = {
        source_id: source,
        status: body.dryRun ? "dry_run" : "pending",
        categories: body.categories ?? [],
        started_at: new Date().toISOString(),
      };
      scrapeJobs.push(job);
    }

    if (!body.dryRun && scrapeJobs.length > 0) {
      const { error: insertError } = await admin
        .from("scrape_jobs")
        .insert(scrapeJobs);

      if (insertError) {
        console.error("Failed to create scrape jobs:", insertError);
        return errorResponse("Failed to create scrape jobs", 500, insertError);
      }
    }

    // ── 2. Log what would be scraped (stub) ──────────────────────────
    const scrapePlan: Record<
      SourceSlug,
      {
        endpoint: string;
        method: string;
        categories: string[];
        estimatedProducts: number;
      }
    > = {
      revolico: {
        endpoint: "https://revolico.com/api/search",
        method: "GET (RSS/Scraping)",
        categories: body.categories ?? ["all"],
        estimatedProducts: 500,
      },
      "1cuba": {
        endpoint: "https://1cuba.cu/api/products",
        method: "GET (REST API)",
        categories: body.categories ?? ["all"],
        estimatedProducts: 300,
      },
      choleslibres: {
        endpoint: "https://choleslibres.com/api/listings",
        method: "GET (REST API)",
        categories: body.categories ?? ["all"],
        estimatedProducts: 200,
      },
      facebook: {
        endpoint: "https://facebook.com/marketplace/api",
        method: "GET (GraphQL)",
        categories: body.categories ?? ["all"],
        estimatedProducts: 1000,
      },
      instagram: {
        endpoint: "https://instagram.com/graphql",
        method: "POST (GraphQL)",
        categories: body.categories ?? ["all"],
        estimatedProducts: 500,
      },
      telegram: {
        endpoint: "t.me/channel Scraper",
        method: "Realtime listener",
        categories: body.categories ?? ["all"],
        estimatedProducts: 200,
      },
    };

    const logEntry = {
      timestamp: new Date().toISOString(),
      sources: sourcesToScrape,
      categories: body.categories ?? ["all"],
      dryRun: body.dryRun ?? false,
      jobsCreated: scrapeJobs.length,
      plan: Object.fromEntries(
        sourcesToScrape.map((s) => [s, scrapePlan[s]])
      ),
    };

    console.log(
      "Scrape request received:",
      JSON.stringify(logEntry, null, 2)
    );

    // ── 3. In production, this would dispatch to scraping workers ─────
    // For now, return the plan and placeholder status
    if (!body.dryRun) {
      // TODO: In production, dispatch to:
      // - Supabase pg_cron → trigger Edge Function per source
      // - Or external worker pool (BullMQ, etc.)
      for (const source of sourcesToScrape) {
        const job = scrapePlan[source];
        console.log(
          `[STUB] Would scrape ${source}: ${job.endpoint} (${job.method})`
        );
        console.log(
          `[STUB] Estimated ${job.estimatedProducts} products from ${source}`
        );
      }
    }

    return jsonResponse(
      {
        message: body.dryRun
          ? "Dry run — no jobs created"
          : `Created ${scrapeJobs.length} scrape job(s)`,
        jobs: scrapeJobs.map((j) => ({
          source: j.source_id,
          status: j.status,
          categories: j.categories,
        })),
        plan: Object.fromEntries(
          sourcesToScrape.map((s) => [s, scrapePlan[s]])
        ),
        dryRun: body.dryRun ?? false,
      },
      200,
      corsHeaders(req.headers.get("origin") ?? undefined)
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Unexpected error in scrape-sources:", err);
    return errorResponse("Internal server error", 500);
  }
});
