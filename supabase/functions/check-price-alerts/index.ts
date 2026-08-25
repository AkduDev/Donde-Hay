/**
 * Dónde Hay - Check Price Alerts Edge Function
 * Scheduled via pg_cron every 15 minutes.
 * Checks active price_alerts against current offers and creates notifications.
 *
 * POST /check-price-alerts  (invoked by pg_cron or manually)
 */

import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, jsonResponse, errorResponse } from "../_shared/supabase.ts";

interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  currency: string;
  direction: "below" | "above";
  last_notified_at: string | null;
}

Deno.serve(async (req: Request) => {
  try {
    // pg_cron sends a POST with a shared secret
    const cronSecret = req.headers.get("X-Cron-Secret") ?? "";
    const expectedSecret = Deno.env.get("CRON_SECRET") ?? "";

    // Allow manual invocation without secret (for testing) but log warning
    if (expectedSecret && cronSecret !== expectedSecret) {
      console.warn(
        "Warning: Invalid or missing X-Cron-Secret. If this is a manual test, you can ignore this."
      );
    }

    const admin = getAdminClient();
    const startTime = Date.now();

    // ── 1. Fetch all active price alerts ─────────────────────────────
    const { data: alerts, error: alertsError } = await admin
      .from("price_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsError) {
      console.error("Failed to fetch alerts:", alertsError);
      return errorResponse("Failed to fetch alerts", 500, alertsError);
    }

    if (!alerts || alerts.length === 0) {
      return jsonResponse({
        message: "No active price alerts",
        processed: 0,
        matched: 0,
        notifications: 0,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`Processing ${alerts.length} active price alerts...`);

    let matchedCount = 0;
    let notificationCount = 0;
    const notifications: Array<{
      user_id: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
    }> = [];

    // ── 2. For each alert, check for matching offers ──────────────────
    // Batch by product_id to avoid N+1 queries
    const uniqueProductIds = [...new Set(alerts.map((a) => a.product_id))];

    // Fetch all relevant offers in one query
    const { data: relevantOffers, error: offersError } = await admin
      .from("product_offers")
      .select("id, product_id, price, currency, source_id, source_url, posted_at")
      .eq("status", "active")
      .in("product_id", uniqueProductIds);

    if (offersError) {
      console.error("Failed to fetch offers:", offersError);
      return errorResponse("Failed to fetch offers", 500, offersError);
    }

    // Fetch product names for notifications
    const { data: products } = await admin
      .from("products")
      .select("id, canonical_name, brand, model")
      .in("id", uniqueProductIds);

    const productMap = new Map(
      (products ?? []).map((p) => [p.id, p])
    );

    // Index offers by product_id
    const offersByProduct = new Map<string, Array<(typeof relevantOffers)[number]>>();
    for (const offer of relevantOffers ?? []) {
      const existing = offersByProduct.get(offer.product_id) ?? [];
      existing.push(offer);
      offersByProduct.set(offer.product_id, existing);
    }

    // ── 3. Check each alert against offers ────────────────────────────
    for (const alert of alerts) {
      const offers = offersByProduct.get(alert.product_id) ?? [];
      if (offers.length === 0) continue;

      const matchingOffers = offers.filter((offer) => {
        // Only consider offers newer than last notification (if any)
        if (
          alert.last_notified_at &&
          offer.posted_at <= alert.last_notified_at
        ) {
          return false;
        }

        if (alert.direction === "below") {
          return offer.price <= alert.target_price;
        } else {
          return offer.price >= alert.target_price;
        }
      });

      if (matchingOffers.length > 0) {
        matchedCount++;

        const product = productMap.get(alert.product_id);
        const productName = product
          ? [product.brand, product.model, product.canonical_name]
              .filter(Boolean)
              .join(" ")
          : "Unknown product";

        const bestMatch = matchingOffers.reduce((best, current) =>
          current.price < best.price ? current : best
        );

        const directionLabel =
          alert.direction === "below" ? "below" : "at or above";

        notifications.push({
          user_id: alert.user_id,
          title: "Price alert matched!",
          body: `${productName} is now ${directionLabel} your target of $${alert.target_price}. Best price: $${bestMatch.price} on ${bestMatch.source_id}.`,
          data: {
            alert_id: alert.id,
            product_id: alert.product_id,
            offer_id: bestMatch.id,
            price: bestMatch.price,
            source_id: bestMatch.source_id,
            source_url: bestMatch.source_url,
          },
        });

        // Update last_notified_at on the alert
        await admin
          .from("price_alerts")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", alert.id);

        notificationCount++;
      }
    }

    // ── 4. Insert notifications into the notifications table ──────────
    if (notifications.length > 0) {
      const { error: notifError } = await admin.from("notifications").insert(
        notifications.map((n) => ({
          user_id: n.user_id,
          title: n.title,
          body: n.body,
          type: "price_alert",
          data: n.data,
          read: false,
        }))
      );

      if (notifError) {
        console.error("Failed to insert notifications:", notifError);
        // Don't fail the whole function for notification insert errors
      }

      // Also broadcast via Supabase Realtime for live updates
      for (const notif of notifications) {
        await admin.channel(`user:${notif.user_id}:notifications`).send({
          type: "broadcast",
          event: "new_notification",
          payload: notif,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `Done. Alerts: ${alerts.length}, Matched: ${matchedCount}, Notifications: ${notificationCount}, Duration: ${durationMs}ms`
    );

    return jsonResponse({
      message: "Price alerts checked successfully",
      processed: alerts.length,
      matched: matchedCount,
      notifications: notificationCount,
      durationMs,
    });
  } catch (err) {
    console.error("Unexpected error in check-price-alerts:", err);
    return errorResponse("Internal server error", 500);
  }
});
