import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck, Loader2, MapPin, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchAlerts } from "@/lib/api/data.functions";
import { severityMeta, type AlertItem } from "@/lib/alerts";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({ meta: [{ title: "Alerts · Asset Vault" }] }),
  component: Alerts,
});

const BUCKET_ORDER = ["critical", "high", "medium"] as const;

function Alerts() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["vault", "alerts"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return fetchAlerts({ data: { accessToken: token } });
    },
    staleTime: 30_000,
  });

  const counts = {
    critical: data?.criticalCount ?? 0,
    high: data?.highCount ?? 0,
    medium: data?.mediumCount ?? 0,
  };
  const total = data?.totalCount ?? 0;
  const alerts = data?.alerts ?? [];

  return (
    <div className="space-y-8">
      <section>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          <AlertTriangle className="h-3.5 w-3.5" /> Security Center
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Active <span className="text-destructive">Threats</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real-time leak detections from the Asset Vault network, ranked by signature confidence.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {BUCKET_ORDER.map((bucket) => {
          const meta = severityMeta[bucket];
          return (
            <div
              key={bucket}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.barClass}`} />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {meta.label}
              </p>
              <p className={`relative mt-2 font-display text-5xl font-extrabold ${meta.toneClass}`}>
                {isLoading ? "—" : counts[bucket]}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Live alerts</h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {isLoading ? "Loading…" : `${total} detection${total === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="mt-2 h-px bg-border" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Scanning for matches…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive">
              {(error as Error)?.message ?? "Failed to load alerts."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="mt-3 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {isRefetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative">
              <div className="absolute inset-0 -m-3 rounded-full bg-success/15 blur-xl" />
              <div className="relative grid h-16 w-16 place-items-center rounded-full bg-success/10 ring-8 ring-success/5">
                <ShieldCheck className="h-7 w-7 text-success" strokeWidth={2.4} />
              </div>
            </div>
            <h2 className="mt-6 font-display text-xl font-bold">No active threats</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              All your protected assets are clean. Upload an asset to register its signature and
              start monitoring.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const meta = severityMeta[alert.severity];
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background ring-1 ring-border ${
            alert.severity === "critical" ? "text-destructive" : ""
          } ${alert.severity === "high" ? "text-warning" : ""} ${alert.severity === "medium" ? "text-secondary" : ""}`}
          aria-label={`${meta.label} severity`}
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{alert.title}</p>
          <p className="text-xs text-muted-foreground">{alert.subtitle}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {meta.label} · {formatRelative(alert.occurredAt)}
          </p>
        </div>
      </div>
      <Link
        to="/app/map"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition hover:bg-muted"
      >
        <MapPin className="h-3 w-3" /> View
        <ExternalLink className="h-3 w-3" />
      </Link>
    </li>
  );
}

function formatRelative(value: string) {
  const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (elapsed < 60) return "just now";
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86_400) return `${Math.floor(elapsed / 3600)}h ago`;
  if (elapsed < 604_800) return `${Math.floor(elapsed / 86_400)}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}
