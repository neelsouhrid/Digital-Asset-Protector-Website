import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = "critical" | "high" | "medium";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  occurredAt: string;
  similarityScore: number;
  locationName: string | null;
  deviceHash: string | null;
  matchedPhash: string;
  lat: number;
  lng: number;
}

export interface AlertSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalCount: number;
  alerts: AlertItem[];
}

/**
 * Fetch alerts (sightings) for the current user, ranked by severity then time.
 *
 * Severity bucketing by `similarity_score` (a 0..1 float):
 *   - critical:  score >= 0.85
 *   - high:      0.65 <= score < 0.85
 *   - medium:    0.45 <= score < 0.65
 *
 * The user only sees sightings whose `matched_phash` is registered as their
 * own in `public.protected_assets`. We do that in two queries: pull the user's
 * phashes, then `sightings` with `matched_phash IN (...)`.
 */
export async function fetchAlertsForUser(userId: string): Promise<AlertSummary> {
  const { data: protectedRows, error: protectedErr } = await supabase
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

  const { data, error } = await supabase
    .from("sightings")
    .select(
      "id, matched_phash, similarity_score, device_hash, location_name, location_lat, location_lng, detected_at",
    )
    .in("matched_phash", phashes)
    .order("detected_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const alerts: AlertItem[] = ((data ?? []) as Array<{
    id: string;
    matched_phash: string;
    similarity_score: number;
    device_hash: string | null;
    location_name: string | null;
    location_lat: number;
    location_lng: number;
    detected_at: string | null;
  }>).map((s) => ({
    id: s.id,
    severity: severityForScore(s.similarity_score),
    title:
      s.location_name && s.location_name !== "Unknown"
        ? `Match detected · ${s.location_name}`
        : "Signature match detected",
    subtitle: `Similarity ${(s.similarity_score * 100).toFixed(1)}% · ${s.device_hash ? `device ${s.device_hash.slice(0, 10)}` : "device unknown"}`,
    occurredAt: s.detected_at ?? new Date().toISOString(),
    similarityScore: s.similarity_score,
    locationName: s.location_name,
    deviceHash: s.device_hash,
    matchedPhash: s.matched_phash,
    lat: s.location_lat,
    lng: s.location_lng,
  }));

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;

  return {
    criticalCount,
    highCount,
    mediumCount,
    totalCount: alerts.length,
    alerts,
  };
}

export function severityForScore(score: number): AlertSeverity {
  if (score >= 0.85) return "critical";
  if (score >= 0.65) return "high";
  if (score >= 0.45) return "medium";
  // Below 0.45 is still a sighting, but we surface it as "medium" to keep the
  // three-bucket UI clean. (The map page shows every sighting regardless.)
  return "medium";
}

export const severityMeta: Record<
  AlertSeverity,
  { label: string; toneClass: string; barClass: string }
> = {
  critical: {
    label: "Critical",
    toneClass: "text-destructive",
    barClass: "from-destructive/15 to-destructive/0",
  },
  high: {
    label: "High",
    toneClass: "text-warning",
    barClass: "from-warning/15 to-warning/0",
  },
  medium: {
    label: "Medium",
    toneClass: "text-secondary",
    barClass: "from-secondary/15 to-secondary/0",
  },
};
