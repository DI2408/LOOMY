import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Resolve the current user from a Supabase JWT (Authorization: Bearer …).
 */
export async function getUserFromBearerToken(
  bearerToken: string | null,
): Promise<{ user: User | null; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { user: null, error: "Supabase public env not configured." };
  }
  const token = bearerToken?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!token) {
    return { user: null, error: "Missing Authorization bearer token." };
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return { user: null, error: error.message };
  return { user: data.user ?? null, error: null };
}
