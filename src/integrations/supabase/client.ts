import { createClient } from "@supabase/supabase-js";

const getEnvVar = (key: string) => {
  if (typeof process !== "undefined" && process.env[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  return undefined;
};

const supabaseUrl = (getEnvVar("VITE_SUPABASE_URL") as string) || "https://placeholder.supabase.co";
const supabasePublishableKey = (getEnvVar("VITE_SUPABASE_ANON_KEY") as string) || "placeholder_key";

if (!getEnvVar("VITE_SUPABASE_URL") || !getEnvVar("VITE_SUPABASE_ANON_KEY")) {
  // Surfaced loudly in dev — the .env file ships the values, so this branch
  // should only fire if someone deploys without configuring env.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Trigger Supabase's hosted Google OAuth flow. Supabase redirects the user to
 * Google's consent screen, then back to the configured callback
 * (https://<project>.supabase.co/auth/v1/callback), which then bounces to
 * `redirectTo` (defaults to <origin>/app/overview).
 *
 * The Supabase project must have the Google provider enabled with the client
 * ID/secret configured in the Supabase dashboard (Authentication → Providers).
 */
export async function signInWithGoogle(redirectTo?: string) {
  const target =
    redirectTo ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/app/overview`
      : undefined);

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: target,
      queryParams: { prompt: "select_account" },
    },
  });
}
