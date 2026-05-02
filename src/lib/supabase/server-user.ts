import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client that forwards the caller's JWT (Authorization: Bearer …)
 * so RLS and rpc_store_advance_order / rpc_courier_advance_order see auth.jwt().
 */
export function getSupabaseForRequest(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
