import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServiceSupabase } from "../supabase-service.server";

/**
 * Server functions that read user-scoped data with the service role key,
 * bypassing RLS. Each function:
 *   1. Verifies the caller has a valid Supabase session (anon client).
 *   2. Pulls `user.id` from that session.
 *   3. Filters every query by that user id, using the service-role client.
 *
 * The .server.ts module is tree-shaken from the client bundle, and the
 * service key never crosses the wire.
 */

// ---- Overview ------------------------------------------------------------

export const fetchOverview = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    // We accept the access token explicitly so we don't have to plumb
    // through cookie / header parsing for every call.
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const userId = userData.user.id;

    const db = getServiceSupabase();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
    fourteenDaysAgo.setUTCHours(0, 0, 0, 0);
    const last24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { data: protectedRows, error: protectedErr } = await db
      .from("protected_assets")
      .select("phash")
      .eq("owner_id", userId);
    if (protectedErr) throw protectedErr;
    const userPhashes = (protectedRows ?? [])
      .map((r: { phash: string }) => r.phash)
      .filter(Boolean);

    const [
      assetsCountResult,
      syncedCountResult,
      assetsResult,
      sightingsResult,
      chartResult,
      sightings24hResult,
      protectedByUserResult,
    ] = await Promise.all([
      db
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      db
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("blockchain_tx", "is", null),
      db
        .from("assets")
        .select("id,name,created_at,hash")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(4),
      userPhashes.length
        ? db
            .from("sightings")
            .select("id,location_name,detected_at")
            .in("matched_phash", userPhashes)
            .order("detected_at", { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
      userPhashes.length
        ? db
            .from("sightings")
            .select("detected_at")
            .in("matched_phash", userPhashes)
            .gte("detected_at", fourteenDaysAgo.toISOString())
        : Promise.resolve({ data: [], error: null } as { data: unknown[]; error: null }),
      userPhashes.length
        ? db
            .from("sightings")
            .select("id", { count: "exact", head: true })
            .in("matched_phash", userPhashes)
            .gte("detected_at", last24h)
        : Promise.resolve({ count: 0, error: null } as { count: number; error: null }),
      db
        .from("protected_assets")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
    ]);

    const firstError = [
      assetsCountResult,
      syncedCountResult,
      assetsResult,
      sightingsResult,
      chartResult,
      sightings24hResult,
      protectedByUserResult,
    ].find((r) => (r as { error: unknown }).error)?.error as
      | { message: string }
      | undefined;
    if (firstError) throw firstError;

    const assetCount = (assetsCountResult as { count: number | null }).count ?? 0;
    const syncedAssetCount = (syncedCountResult as { count: number | null }).count ?? 0;
    const protectedAssetCount = (protectedByUserResult as { count: number | null }).count ?? 0;
    const sightingsLast24h = (sightings24hResult as { count: number | null }).count ?? 0;

    type RecentEvent = { id: string; title: string; occurredAt: string; type: "asset" | "sighting" };
    const recentEvents: RecentEvent[] = [
      ...((assetsResult.data ?? []) as Array<{ id: string; name: string | null; created_at: string }>).map(
        (a) => ({
          id: `asset-${a.id}`,
          title: a.name ? `Asset added · ${a.name}` : "Asset registered",
          occurredAt: a.created_at,
          type: "asset" as const,
        }),
      ),
      ...((sightingsResult.data ?? []) as Array<{ id: string; location_name: string | null; detected_at: string | null }>).map(
        (s) => ({
          id: `sighting-${s.id}`,
          title:
            s.location_name && s.location_name !== "Unknown"
              ? `Match detected · ${s.location_name}`
              : "Signature match detected",
          occurredAt: s.detected_at ?? new Date().toISOString(),
          type: "sighting" as const,
        }),
      ),
    ]
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
      .slice(0, 4);

    const dailySightings = Array.from({ length: 14 }).fill(0) as number[];
    for (const sighting of (chartResult.data ?? []) as Array<{ detected_at: string | null }>) {
      if (!sighting.detected_at) continue;
      const dayIndex = Math.floor(
        (Date.parse(sighting.detected_at) - fourteenDaysAgo.getTime()) / 86_400_000,
      );
      if (dayIndex >= 0 && dayIndex < dailySightings.length) dailySightings[dayIndex] += 1;
    }

    return {
      assetCount,
      protectedAssetCount,
      activeLeakCount: userPhashes.length === 0 ? 0 : (chartResult.data ?? []).length,
      sightingsLast24h,
      syncedAssetCount,
      blockchainSync: assetCount === 0 ? 0 : Math.round((syncedAssetCount / assetCount) * 100),
      recentEvents,
      dailySightings,
    };
  });

// ---- Alerts --------------------------------------------------------------

export const fetchAlerts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const userId = userData.user.id;

    const db = getServiceSupabase();
    const { data: protectedRows, error: protectedErr } = await db
      .from("protected_assets")
      .select("phash")
      .eq("owner_id", userId);
    if (protectedErr) throw protectedErr;
    const phashes = (protectedRows ?? [])
      .map((r: { phash: string }) => r.phash)
      .filter(Boolean);
    if (phashes.length === 0) {
      return { criticalCount: 0, highCount: 0, mediumCount: 0, totalCount: 0, alerts: [] };
    }

    const { data: rows, error } = await db
      .from("sightings")
      .select(
        "id, matched_phash, sighting_phash, similarity_score, device_hash, location_name, location_lat, location_lng, blockchain_owner_tx, detected_at",
      )
      .in("matched_phash", phashes)
      .order("detected_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    type Raw = {
      id: string;
      matched_phash: string;
      sighting_phash: string;
      similarity_score: number;
      device_hash: string | null;
      location_name: string | null;
      location_lat: number;
      location_lng: number;
      blockchain_owner_tx: string | null;
      detected_at: string | null;
    };
    const alerts = ((rows ?? []) as Raw[]).map((s) => {
      const severity: "critical" | "high" | "medium" =
        s.similarity_score >= 0.85
          ? "critical"
          : s.similarity_score >= 0.65
            ? "high"
            : "medium";
      return {
        id: s.id,
        severity,
        title:
          s.location_name && s.location_name !== "Unknown"
            ? `Match detected · ${s.location_name}`
            : "Signature match detected",
        subtitle: `Similarity ${(s.similarity_score * 100).toFixed(1)}% · ${
          s.device_hash ? `device ${s.device_hash.slice(0, 10)}` : "device unknown"
        }`,
        occurredAt: s.detected_at ?? new Date().toISOString(),
        similarityScore: s.similarity_score,
        locationName: s.location_name,
        deviceHash: s.device_hash,
        matchedPhash: s.matched_phash,
        lat: s.location_lat,
        lng: s.location_lng,
      };
    });

    return {
      criticalCount: alerts.filter((a) => a.severity === "critical").length,
      highCount: alerts.filter((a) => a.severity === "high").length,
      mediumCount: alerts.filter((a) => a.severity === "medium").length,
      totalCount: alerts.length,
      alerts,
    };
  });

// ---- Sightings (Map) -----------------------------------------------------

export const fetchSightings = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const userId = userData.user.id;

    const db = getServiceSupabase();
    const { data: protectedRows, error: protectedErr } = await db
      .from("protected_assets")
      .select("phash")
      .eq("owner_id", userId);
    if (protectedErr) throw protectedErr;
    const phashes = (protectedRows ?? [])
      .map((r: { phash: string }) => r.phash)
      .filter(Boolean);
    if (phashes.length === 0) return [];

    const { data: rows, error } = await db
      .from("sightings")
      .select(
        "id, matched_phash, sighting_phash, similarity_score, device_hash, location_name, location_lat, location_lng, blockchain_owner_tx, detected_at",
      )
      .in("matched_phash", phashes)
      .order("detected_at", { ascending: false });
    if (error) throw error;

    return rows ?? [];
  });

// ---- Profile (display name) ---------------------------------------------

export const fetchProfileDisplayName = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const user = userData.user;

    const db = getServiceSupabase();
    const { data: profile, error: profileErr } = await db
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profileErr && profile?.display_name) return profile.display_name;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    for (const key of ["display_name", "full_name", "name"] as const) {
      const v = meta[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    if (user.email && user.email.includes("@")) return user.email.split("@")[0];
    return "User";
  });

// ---- Vault (user's registered assets) -----------------------------------

export const fetchVault = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const userId = userData.user.id;

    const db = getServiceSupabase();
    const { data: rows, error } = await db
      .from("assets")
      .select(
        "id,user_id,name,size,status,hash,created_at,scanned_at,block_number,blockchain_tx,is_enforced",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

// ---- Notifications (header bell) ----------------------------------------
// Pulls the most recent sightings for this user's protected phashes.
// Returned rows are the same shape the header popover renders.

export const fetchNotifications = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
    const userId = userData.user.id;

    const db = getServiceSupabase();
    const { data: protectedRows, error: protectedErr } = await db
      .from("protected_assets")
      .select("phash")
      .eq("owner_id", userId);
    if (protectedErr) throw protectedErr;
    const phashes = (protectedRows ?? [])
      .map((r: { phash: string }) => r.phash)
      .filter(Boolean);
    if (phashes.length === 0) return [];

    const { data: rows, error } = await db
      .from("sightings")
      .select("id,location_name,detected_at")
      .in("matched_phash", phashes)
      .order("detected_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return rows ?? [];
  });
