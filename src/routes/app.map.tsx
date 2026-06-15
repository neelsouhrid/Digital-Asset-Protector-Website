import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Globe, Radio, Plus, Minus, Loader2, MapPin, RefreshCw } from "lucide-react";
import { SightingsMap } from "@/components/map/SightingsMap";
import { supabase } from "@/integrations/supabase/client";
import { fetchSightings } from "@/lib/api/data.functions";
import { uniqueRegions } from "@/lib/sightings";

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Distribution Map · Asset Vault" }] }),
  component: MapPage,
});

function MapPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["vault", "sightings"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return fetchSightings({ data: { accessToken: token } });
    },
    staleTime: 30_000,
  });

  const sightings = data ?? [];
  const regionCount = uniqueRegions(sightings).length;

  return (
    <div className="space-y-8">
      <section>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          <Globe className="h-3.5 w-3.5" /> Global Tracking
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Worldwide <span className="gradient-text">Distribution Map</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real-time pin drops where your signatures have been re-encountered.
        </p>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="relative h-[460px] w-full">
          {isLoading ? <MapLoading /> : <SightingsMap sightings={sightings} />}

          {/* Zoom controls */}
          <div className="absolute left-4 top-4 z-[400] flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-soft">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("vault:map:zoom-in"))}
              className="grid h-9 w-9 place-items-center text-foreground hover:bg-muted"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="h-px bg-border" />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("vault:map:zoom-out"))}
              className="grid h-9 w-9 place-items-center text-foreground hover:bg-muted"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {/* Legend / count badge */}
          <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 shadow-soft backdrop-blur">
            <span className="grid h-2.5 w-2.5 place-items-center rounded-full bg-primary ring-4 ring-primary/20" />
            <span className="text-xs font-medium text-foreground">
              {sightings.length} sighting{sightings.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              aria-label="Refresh sightings"
            >
              {isRefetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              {isRefetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">Detection hotspots</h3>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {sightings.length === 0
              ? "0 active regions"
              : `${regionCount} region${regionCount === 1 ? "" : "s"}`}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading detections…
          </div>
        ) : isError ? (
          <p className="mt-3 text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to load sightings."}
          </p>
        ) : sightings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No active regions yet. Once your signatures are detected, hotspots will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {sightings.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.location_name ?? "Unknown location"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Match {(s.similarity_score * 100).toFixed(1)}%
                      {s.detected_at
                        ? ` · ${formatDistanceToNow(new Date(s.detected_at), { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="hidden shrink-0 text-[10px] font-mono text-muted-foreground sm:block">
                  {s.location_lat.toFixed(1)}, {s.location_lng.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MapLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/10 via-primary/5 to-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
