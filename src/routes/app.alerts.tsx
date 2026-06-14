import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({ meta: [{ title: "Alerts · Asset Vault" }] }),
  component: Alerts,
});

const sev = [
  { label: "Critical", value: 0, tone: "destructive", bar: "from-destructive/15 to-destructive/0" },
  { label: "High", value: 0, tone: "warning", bar: "from-warning/15 to-warning/0" },
  { label: "Medium", value: 0, tone: "secondary", bar: "from-secondary/15 to-secondary/0" },
] as const;

function Alerts() {
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
        {sev.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.bar}`} />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            <p className={`relative mt-2 font-display text-5xl font-extrabold text-${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Live alerts</h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">0 detections</span>
        </div>
        <div className="mt-2 h-px bg-border" />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 -m-3 rounded-full bg-success/15 blur-xl" />
            <div className="relative grid h-16 w-16 place-items-center rounded-full bg-success/10 ring-8 ring-success/5">
              <ShieldCheck className="h-7 w-7 text-success" strokeWidth={2.4} />
            </div>
          </div>
          <h2 className="mt-6 font-display text-xl font-bold">No active threats</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            All your protected assets are clean. Upload an asset to register its signature and start monitoring.
          </p>
        </div>
      </section>
    </div>
  );
}
