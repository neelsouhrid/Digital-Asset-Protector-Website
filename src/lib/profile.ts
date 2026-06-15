import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the best display name we can find for the signed-in user. Lookup
 * order:
 *   1. `public.profiles.display_name` (canonical, set by the app)
 *   2. `user.user_metadata.display_name` (set during signUp or Google OAuth)
 *   3. `user.user_metadata.full_name` (Google's standard claim)
 *   4. `user.user_metadata.name`
 *   5. local-part of `user.email`
 *   6. "User"
 *
 * Profiles table is best-effort — we fall back to user_metadata even if the
 * profile read fails (e.g. RLS denies the row, or no profile row exists yet).
 */
export async function fetchDisplayName(user: User | null | undefined): Promise<string> {
  if (!user) return "User";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  // 1. profiles.display_name
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data?.display_name) return data.display_name;
  } catch {
    // ignore — fall through
  }

  // 2-4. user_metadata claims
  for (const key of ["display_name", "full_name", "name"] as const) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // 5. email local part
  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return "User";
}

/**
 * Synchronous fallback for places where a `User` is in scope but we don't
 * want to wait on a DB read (e.g. the header avatar). Mirrors the lookup
 * order in fetchDisplayName, minus the profiles table.
 */
export function displayNameFromUser(user: User | null | undefined): string {
  if (!user) return "User";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  for (const key of ["display_name", "full_name", "name"] as const) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }
  return "User";
}
