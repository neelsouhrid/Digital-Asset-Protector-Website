/**
 * Region bucketing by 10° grid. Used by the "Detection hotspots" header to
 * show a meaningful "N active regions" count even when many sightings cluster.
 *
 * Sightings come straight out of the `sightings` table (snake_case from
 * Supabase) — we bucket by `location_lat` / `location_lng`.
 */
export function uniqueRegions(
  sightings: Array<{ location_lat: number; location_lng: number }>,
): string[] {
  const seen = new Set<string>();
  for (const s of sightings) {
    const lat = Math.round(s.location_lat / 10) * 10;
    const lng = Math.round(s.location_lng / 10) * 10;
    seen.add(`${lat},${lng}`);
  }
  return Array.from(seen);
}
