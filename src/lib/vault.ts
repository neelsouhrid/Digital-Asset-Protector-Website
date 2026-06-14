import { supabase } from "@/integrations/supabase/client";
import type {
  ProtectedAssetWithMeta,
  Sighting,
  Asset,
  ProtectedAsset,
} from "./types";

/**
 * Fetch the current user's protected assets.
 *
 * We read `public.protected_assets` filtered by `owner_id`, then pull the
 * matching `public.assets` rows by phash. PostgREST's embedded-resource syntax
 * (`assets(...)`) won't help here because the join key lives in two different
 * columns (`phash` in protected_assets, `hash` in assets), so we do two
 * round-trips and stitch them in JS. Cheap — the user's phash set is tiny.
 */
export async function fetchProtectedAssets(
  userId: string,
): Promise<ProtectedAssetWithMeta[]> {
  const [{ data: protectedRows, error: protectedErr }, { data: assetRows, error: assetErr }] =
    await Promise.all([
      supabase
        .from("protected_assets")
        .select("id, phash, owner_id, blockchain_tx, created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("assets")
        .select(
          "id, name, hash, size, status, is_enforced, enforced_at, scanned_at, app_email",
        )
        .eq("user_id", userId),
    ]);

  if (protectedErr) throw protectedErr;
  if (assetErr) throw assetErr;

  const assetsByHash = new Map<string, Asset[]>();
  for (const a of (assetRows ?? []) as Asset[]) {
    if (!a.hash) continue;
    const list = assetsByHash.get(a.hash) ?? [];
    list.push(a);
    assetsByHash.set(a.hash, list);
  }

  return ((protectedRows ?? []) as ProtectedAsset[]).map((p) => {
    const candidates = assetsByHash.get(p.phash) ?? [];
    // Prefer the most recently scanned asset for this phash.
    const asset = candidates.sort((a, b) =>
      (b.scanned_at ?? "").localeCompare(a.scanned_at ?? ""),
    )[0] ?? null;
    return { ...p, asset };
  });
}

/**
 * Fetch sightings for the current user. Strategy: pull the user's phashes
 * first, then `sightings` whose `matched_phash` is in that set.
 *
 * If the user has zero phashes, return [] without making the second query.
 */
export async function fetchSightingsForUser(
  userId: string,
): Promise<Sighting[]> {
  const { data: protectedRows, error: protectedErr } = await supabase
    .from("protected_assets")
    .select("phash")
    .eq("owner_id", userId);

  if (protectedErr) throw protectedErr;

  const phashes = (protectedRows ?? [])
    .map((r: { phash: string }) => r.phash)
    .filter(Boolean);

  if (phashes.length === 0) return [];

  const { data, error } = await supabase
    .from("sightings")
    .select("*")
    .in("matched_phash", phashes)
    .order("detected_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Sighting[];
}
