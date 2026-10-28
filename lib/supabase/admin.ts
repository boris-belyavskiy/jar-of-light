import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Bypasses RLS. Used for one thing only: deleting the signed-in user's own
 * auth account (DATA-02). The secret key lives in Vercel and `.env.local`.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(env.supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
