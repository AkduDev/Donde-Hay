/**
 * Dónde Hay - Admin Supabase Client
 * Uses service_role key for server-side operations (bypasses RLS)
 * Only use in Edge Functions, NEVER expose to client
 */

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

let adminClient: SupabaseClient | null = null;

/**
 * Get or create the admin Supabase client (singleton).
 * Uses SUPABASE_SERVICE_ROLE_KEY for elevated privileges.
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceRoleKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not set. Required for admin operations."
      );
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

/**
 * Standard JSON response helper
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): Response {
  return jsonResponse(
    { error: message, details: details ?? null },
    status
  );
}
