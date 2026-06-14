import { createFileRoute } from "@tanstack/react-router";
import { Boxes, OctagonAlert, Cpu, Upload, Activity, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/overview")({
  head: () => ({ meta: [{ title: "Overview · Asset Vault" }] }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Digital DNA · Overview</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back, <span className="gradient-text">Rosy Sultana</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Your protected library is clean. Register assets below or use Quick Scan to fingerprint new content.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button variant="hero" size="lg" className="h-11"><Upload className="h-4 w-4" /> Upload asset</Button>
          <Button variant="outline" size="lg" className="h-11"><Activity className="h-4 w-4" /> Quick Scan</Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Protected assets"
          value="0"
          trend="Get started"
          trendTone="primary"
          icon={Boxes}
          gradient="from-primary/12 via-primary/4 to-transparent"
          iconBg="bg-primary/10 text-primary"
        />
        <StatCard
          label="Active leaks"
          value="0"
          trend="All clear"
          trendTone="success"
          icon={OctagonAlert}
          gradient="from-destructive/10 via-destructive/3 to-transparent"
          iconBg="bg-destructive/10 text-destructive"
        />
        <StatCard
          label="Blockchain sync"
          value="100%"
          trend="Polygon · 18ms"
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
              <p className="text-sm text-muted-foreground">Signature matches across the open web — last 14 days.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <TrendingUp className="h-3 w-3" /> stable
            </span>
          </div>
          <div className="mt-6">
            <AreaChart />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-bold">Recent events</h3>
          <ul className="mt-4 space-y-3">
            {[
              { t: "Vault initialized", d: "just now", tone: "primary" },
              { t: "Polygon sync verified", d: "2 min ago", tone: "success" },
              { t: "Scan window scheduled", d: "12 min ago", tone: "secondary" },
            ].map((e) => (
              <li key={e.t} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full bg-${e.tone}`} />
                  <span className="text-sm font-medium text-foreground">{e.t}</span>
                </div>
                <span className="text-xs text-muted-foreground">{e.d}</span>
              </li>
            ))}
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
  label, value, trend, trendTone, icon: Icon, gradient, iconBg,
}: { label: string; value: string; trend: string; trendTone: "success" | "primary"; icon: React.ElementType; gradient: string; iconBg: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={`relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-${trendTone}`}>
        <TrendingUp className="h-3.5 w-3.5" /> {trend}
      </div>
    </div>
  );
}

function AreaChart() {
  const data = [4, 8, 6, 12, 9, 14, 10, 18, 13, 20, 16, 22, 17, 24];
  const max = Math.max(...data);
  const path = data.map((p, i) => `${(i / (data.length - 1)) * 100},${60 - (p / max) * 52}`).join(" ");
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-44 w-full">
      <defs>
        <linearGradient id="ac" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2="100" y1={i * 15 + 7} y2={i * 15 + 7} stroke="var(--color-border)" strokeWidth="0.2" />
      ))}
      <polygon points={`0,60 ${path} 100,60`} fill="url(#ac)" />
      <polyline points={path} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
