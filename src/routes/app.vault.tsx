import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FolderLock,
  Upload,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Hash,
  Link2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProtectedAssets } from "@/lib/vault";
import type { ProtectedAssetWithMeta } from "@/lib/types";

export const Route = createFileRoute("/app/vault")({
  head: () => ({ meta: [{ title: "Vault · Asset Vault" }] }),
  component: Vault,
});

function Vault() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["vault", "protected-assets"],
    queryFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userData.user) throw new Error("Not signed in");
      return fetchProtectedAssets(userData.user.id);
    },
    staleTime: 30_000,
  });

  const assets = data ?? [];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Media Vault</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Protected Library</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every asset is fingerprinted and anchored on-chain. Click any item to inspect its signature. As the registered owner you can blur the image globally or transfer ownership.
        </p>
      </section>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load vault."}
          onRetry={() => refetch()}
        />
      ) : assets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{assets.length}</span> protected
              {assets.length === 1 ? " asset" : " assets"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 text-xs"
            >
              {isRefetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: ProtectedAssetWithMeta }) {
  const [copied, setCopied] = useState<"phash" | "tx" | null>(null);

  function copy(value: string, which: "phash" | "tx") {
    void navigator.clipboard.writeText(value);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const name = asset.asset?.name ?? "Untitled asset";
  const status = asset.asset?.status ?? "clean";
  const tx = asset.asset?.blockchain_tx ?? asset.blockchain_tx ?? null;
  const scannedAt = asset.asset?.scanned_at ?? asset.created_at ?? null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/6" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <StatusPill status={status} enforced={!!asset.asset?.is_enforced} />
        </div>

        <h3 className="mt-4 font-display text-base font-bold leading-tight line-clamp-2" title={name}>
          {name}
        </h3>

        {scannedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Scanned {formatDistanceToNow(new Date(scannedAt), { addSuffix: true })}
          </p>
        ) : null}

        <div className="mt-4 space-y-2">
          <HashRow
            label="phash"
            value={asset.phash}
            copied={copied === "phash"}
            onCopy={() => copy(asset.phash, "phash")}
          />
          {tx ? (
            <HashRow
              label="tx"
              value={tx}
              copied={copied === "tx"}
              onCopy={() => copy(tx, "tx")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HashRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const Icon = label === "tx" ? Link2 : Hash;
  const display = value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/50"
      title={value}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="ml-auto truncate font-mono text-xs text-foreground">{display}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

function StatusPill({ status, enforced }: { status: "clean" | "leaked"; enforced: boolean }) {
  if (status === "leaked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
        Leaked
      </span>
    );
  }
  if (enforced) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success">
        Enforced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
      Clean
    </span>
  );
}

function LoadingState() {
  return (
    <section className="flex items-center justify-center rounded-3xl border border-border bg-card p-16 shadow-soft">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 shadow-soft">
      <h3 className="font-display text-base font-bold text-destructive">Could not load your vault</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-soft">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_18px_40px_-12px_rgba(37,99,235,0.55)]">
          <FolderLock className="h-7 w-7" strokeWidth={2.4} />
        </div>
        <h2 className="mt-6 font-display text-xl font-bold">Your vault is empty</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Drop your first asset to fingerprint it and register its on-chain signature.
        </p>
        <Button variant="hero" size="lg" className="mt-6">
          <Upload className="h-4 w-4" /> Upload first asset
        </Button>
      </div>
    </section>
  );
}
