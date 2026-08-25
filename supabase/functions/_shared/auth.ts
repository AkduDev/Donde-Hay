/**
 * Dónde Hay - JWT Auth Helper for Edge Functions
 * Verifies Supabase JWT from Authorization header
 */

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthContext {
  user: AuthUser;
  supabase: SupabaseClient;
}

/**
 * Verify the JWT from the request and return user + an authenticated client.
 * Throws a Response (401) if token is missing or invalid.
 */
export async function verifyAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return {
    user: { id: user.id, email: user.email, role: user.role },
    supabase,
  };
}

/**
 * Optional auth — returns user if token is valid, null otherwise.
 * Does NOT throw on missing/invalid token.
 */
export async function optionalAuth(
  req: Request
): Promise<{ user: AuthUser | null; supabase: SupabaseClient }> {
  try {
    const ctx = await verifyAuth(req);
    return { user: ctx.user, supabase: ctx.supabase };
  } catch {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    return {
      user: null,
      supabase: createClient(supabaseUrl, supabaseAnonKey),
    };
  }
}
