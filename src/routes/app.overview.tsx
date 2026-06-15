import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Boxes, OctagonAlert, Cpu, Upload, Activity, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/assets";
import { fetchOverview, fetchProfileDisplayName } from "@/lib/api/data.functions";

export const Route = createFileRoute("/app/overview")({
  head: () => ({ meta: [{ title: "Overview · Asset Vault" }] }),
  component: Overview,
});

function Overview() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanResult, setScanResult] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["overview-dashboard"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return fetchOverview({ data: { accessToken: token } });
    },
  });
  const { data: displayName = "there" } = useQuery({
    queryKey: ["profile", "display-name"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return "there";
      return fetchProfileDisplayName({ data: { accessToken: token } });
    },
    staleTime: 60_000,
  });
  const upload = useMutation({
    mutationFn: uploadAsset,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["overview-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["vault-assets"] }),
      ]);
    },
  });
  const quickScan = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");

      // Pull this user's assets only.
      const { data: assets, error: scanError } = await supabase
        .from("assets")
        .select("id,name,status,hash")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      if (scanError) throw scanError;
      if (!assets?.length) return "No assets available to scan.";

      // Cross-reference each asset hash with the global sightings table
      // to count matches found in the last 24h.
      const hashes = assets.map((a) => a.hash).filter(Boolean) as string[];
      let recentMatches = 0;
      if (hashes.length) {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count } = await supabase
          .from("sightings")
          .select("id", { count: "exact", head: true })
          .in("matched_phash", hashes)
          .gte("detected_at", since);
        recentMatches = count ?? 0;
      }

      const flagged = assets.filter((asset) => asset.status === "leaked").length;
      const parts: string[] = [];
      parts.push(
        `Scanned ${assets.length} asset${assets.length === 1 ? "" : "s"} from your vault.`,
      );
      if (flagged) parts.push(`${flagged} marked as leaked.`);
      if (recentMatches) parts.push(`${recentMatches} new match${recentMatches === 1 ? "" : "es"} in the last 24h.`);
      if (!flagged && !recentMatches) parts.push("No known leaks found.");
      return parts.join(" ");
    },
    onSuccess: setScanResult,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      {/* Header */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Digital DNA · Overview
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {data && data.assetCount > 0
            ? `Your vault is being monitored. ${data.activeLeakCount} active leak${data.activeLeakCount === 1 ? "" : "s"} across ${data.assetCount} asset${data.assetCount === 1 ? "" : "s"}.`
            : "Your protected library is empty. Register assets below or use Quick Scan to fingerprint new content."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button
            variant="hero"
            size="lg"
            className="h-11"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload asset"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            onClick={() => quickScan.mutate()}
            disabled={quickScan.isPending}
          >
            <Activity className="h-4 w-4" /> {quickScan.isPending ? "Scanning…" : "Quick Scan"}
          </Button>
        </div>
        {upload.isSuccess && (
          <p className="mt-3 text-sm text-success" role="status">
            Asset uploaded successfully.
          </p>
        )}
        {upload.error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {upload.error.message || "The asset could not be uploaded."}
          </p>
        )}
        {scanResult && (
          <p className="mt-3 text-sm text-foreground" role="status">
            {scanResult}
          </p>
        )}
        {quickScan.error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {quickScan.error.message || "Quick Scan could not be completed."}
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Protected assets"
          value={isLoading ? "—" : String(data?.assetCount ?? 0)}
          trend={
            data && data.assetCount > 0
              ? `${data.protectedAssetCount} on-chain`
              : "Get started"
          }
          trendTone="primary"
          icon={Boxes}
          gradient="from-primary/12 via-primary/4 to-transparent"
          iconBg="bg-primary/10 text-primary"
        />
        <StatCard
          label="Active leaks"
          value={isLoading ? "—" : String(data?.activeLeakCount ?? 0)}
          trend={
            data && data.activeLeakCount > 0
              ? `${data.sightingsLast24h} new in 24h`
              : "All clear"
          }
          trendTone={data?.activeLeakCount ? "destructive" : "success"}
          icon={OctagonAlert}
          gradient="from-destructive/10 via-destructive/3 to-transparent"
          iconBg="bg-destructive/10 text-destructive"
        />
        <StatCard
          label="Blockchain sync"
          value={isLoading ? "—" : `${data?.blockchainSync ?? 0}%`}
          trend={
            data && data.assetCount > 0
              ? `${data.syncedAssetCount} of ${data.assetCount} anchored`
              : "No assets yet"
          }
          trendTone="success"
          icon={Cpu}
          gradient="from-success/12 via-success/3 to-transparent"
          iconBg="bg-success/10 text-success"
        />
      </section>

      {/* Activity */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold">Detection activity</h3>
              <p className="text-sm text-muted-foreground">
                Signature matches against your assets — last 14 days.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                data && data.dailySightings.some((count) => count > 0)
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success"
              }`}
            >
              <TrendingUp className="h-3 w-3" />{" "}
              {data && data.dailySightings.some((count) => count > 0) ? "active" : "clear"}
            </span>
          </div>
          <div className="mt-6">
            {isLoading ? (
              <div
                className="h-44 animate-pulse rounded-2xl bg-muted"
                aria-label="Loading detection activity"
              />
            ) : data?.dailySightings.some((count) => count > 0) ? (
              <AreaChart data={data.dailySightings} />
            ) : (
              <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                No detections in the last 14 days.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-bold">Recent events</h3>
          <ul className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((item) => (
                <li
                  key={item}
                  className="h-12 animate-pulse rounded-2xl border border-border/60 bg-muted"
                  aria-hidden="true"
                />
              ))
            ) : data?.recentEvents.length ? (
              data.recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${event.type === "sighting" ? "bg-destructive" : "bg-primary"}`}
                    />
                    <span className="text-sm font-medium text-foreground">{event.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.occurredAt)}
                  </span>
                </li>
              ))
            ) : (
              <li className="flex h-36 items-center justify-center text-center text-sm text-muted-foreground">
                {error ? "Recent activity is unavailable." : "No recent activity yet."}
              </li>
            )}
          </ul>
          <button className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
            View timeline <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  trendTone,
  icon: Icon,
  gradient,
  iconBg,
}: {
  label: string;
  value: string;
  trend: string;
  trendTone: "success" | "primary" | "destructive";
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}) {
  const trendColorClass =
    trendTone === "success"
      ? "text-success"
      : trendTone === "destructive"
        ? "text-destructive"
        : "text-primary";
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className={`relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold ${trendColorClass}`}
      >
        <TrendingUp className="h-3.5 w-3.5" /> {trend}
      </div>
    </div>
  );
}

type RecentEvent = {
  id: string;
  title: string;
  occurredAt: string;
  type: "asset" | "sighting";
};

function formatRelativeTime(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604_800) return `${Math.floor(elapsedSeconds / 86_400)}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function AreaChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const path = data
    .map((p, i) => `${(i / (data.length - 1)) * 100},${60 - (p / max) * 52}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-44 w-full">
      <defs>
        <linearGradient id="ac" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2="100"
          y1={i * 15 + 7}
          y2={i * 15 + 7}
          stroke="var(--color-border)"
          strokeWidth="0.2"
        />
      ))}
      <polygon points={`0,60 ${path} 100,60`} fill="url(#ac)" />
      <polyline
        points={path}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
