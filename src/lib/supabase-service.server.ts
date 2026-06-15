import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import process from "node:process";

/**
 * Server-side Supabase client using the service role key. This client
 * **bypasses Row Level Security** — every row in every table is visible.
 *
 * Use it ONLY inside server functions (createServerFn handlers) or .server.ts
 * files. The service key must never be imported into a client-side bundle.
 *
 * We read the key from process.env per-request (per config.server.ts) so this
 * is safe to call from any server context, including Cloudflare Workers where
 * module-scope env reads are undefined.
 */
let _serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "[supabase-service] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY. " +
        "Add them to .env locally and to the Netlify dashboard (Site settings → " +
        "Environment variables) for production.",
    );
  }
  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}
