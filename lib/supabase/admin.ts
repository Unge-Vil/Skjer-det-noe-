import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for TRUSTED SERVER ROUTES ONLY (public write-API,
 * ICS sync, cron). Bypasses RLS, so every caller must scope writes itself. Never
 * import this into a client component — `SUPABASE_SECRET_KEY` has no NEXT_PUBLIC
 * prefix and is only present server-side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
