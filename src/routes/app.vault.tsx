import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Box, CheckCircle2, FolderLock, Link2, RefreshCw, ScanLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/assets";
import { fetchVault } from "@/lib/api/data.functions";

export const Route = createFileRoute("/app/vault")({
  head: () => ({ meta: [{ title: "Vault · Asset Vault" }] }),
  component: Vault,
});

function Vault() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    data: assets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["vault-assets"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Authentication required");
      return fetchVault({ data: { accessToken: token } });
    },
  });
  const upload = useMutation({
    mutationFn: uploadAsset,
    onSuccess: async () => {
      await refetch();
    },
  });
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];

  const chooseFile = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
    event.target.value = "";
  };

  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) setSelectedAssetId(assets[0].id);
  }, [assets, selectedAssetId]);

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Media Vault
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Protected Library
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every asset is fingerprinted and anchored on-chain. Click any item to inspect its
          signature. As the registered owner you can blur the image globally or transfer ownership.
        </p>
      </section>

      {upload.isSuccess && (
        <p className="text-sm text-success" role="status">
          Asset uploaded successfully.
        </p>
      )}
      {upload.error && (
        <p className="text-sm text-destructive" role="alert">
          {getUploadError(upload.error)}
        </p>
      )}

      {isLoading ? (
        <section className="grid gap-5 lg:grid-cols-3" aria-label="Loading protected assets">
          <div className="space-y-3 lg:col-span-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-3xl border border-border bg-muted"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-3xl border border-border bg-muted" />
        </section>
      ) : error ? (
        <section className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <RefreshCw className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-display text-xl font-bold">Your vault could not be loaded</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <Button variant="outline" size="lg" className="mt-6" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          </div>
        </section>
      ) : assets.length === 0 ? (
        <section className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_18px_40px_-12px_rgba(37,99,235,0.55)]">
              <FolderLock className="h-7 w-7" strokeWidth={2.4} />
            </div>
            <h2 className="mt-6 font-display text-xl font-bold">Your vault is empty</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Drop your first asset to fingerprint it and register its on-chain signature.
            </p>
            <Button
              variant="hero"
              size="lg"
              className="mt-6"
              onClick={chooseFile}
              disabled={upload.isPending}
            >
              <Upload className="h-4 w-4" />{" "}
              {upload.isPending ? "Uploading…" : "Upload first asset"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {assets.map((asset) => (
              <Button
                key={asset.id}
                variant="ghost"
                onClick={() => setSelectedAssetId(asset.id)}
                className={`h-auto w-full justify-start rounded-3xl border bg-card p-5 text-left shadow-soft hover:bg-muted ${selectedAsset?.id === asset.id ? "border-primary/40" : "border-border"}`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Box className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-bold">
                    {asset.name || "Untitled asset"}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {formatFileSize(asset.size)} · Added {formatDate(asset.created_at)}
                  </span>
                </span>
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold capitalize text-success">
                  {asset.status || "registered"}
                </span>
              </Button>
            ))}
          </div>

          {selectedAsset ? (
            <aside className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Asset details
                  </p>
                  <h2 className="mt-2 truncate font-display text-lg font-bold">
                    {selectedAsset.name || "Untitled asset"}
                  </h2>
                </div>
                {selectedAsset.is_enforced && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Enforced" />
                )}
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <Detail label="Status" value={selectedAsset.status || "Registered"} />
                <Detail label="Size" value={formatFileSize(selectedAsset.size)} />
                <Detail label="Fingerprint" value={selectedAsset.hash || "Not available"} mono />
                <Detail
                  label="Last scanned"
                  value={
                    selectedAsset.scanned_at ? formatDate(selectedAsset.scanned_at) : "Not scanned"
                  }
                />
                <Detail
                  label="Protection"
                  value={selectedAsset.is_enforced ? "Enforced" : "Monitoring"}
                />
              </dl>

              <div className="mt-6 border-t border-border pt-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" /> Blockchain
                </p>
                {selectedAsset.blockchain_tx || selectedAsset.block_number ? (
                  <dl className="mt-4 space-y-4 text-sm">
                    <Detail
                      label="Block number"
                      value={selectedAsset.block_number?.toLocaleString() ?? "Pending"}
                    />
                    <Detail
                      label="Transaction"
                      value={selectedAsset.blockchain_tx || "Pending"}
                      mono
                    />
                  </dl>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <ScanLine className="h-4 w-4" /> Blockchain proof pending.
                  </p>
                )}
              </div>
            </aside>
          ) : null}
        </section>
      )}
    </div>
  );
}

type Asset = {
  id: string;
  user_id: string;
  name: string | null;
  size: number | null;
  status: string | null;
  hash: string | null;
  created_at: string;
  scanned_at: string | null;
  block_number: number | null;
  blockchain_tx: string | null;
  is_enforced: boolean | null;
};

function getUploadError(error: Error) {
  return error.message || "The asset could not be uploaded. Please try again.";
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 break-all font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatFileSize(size: number | null) {
  if (size === null || size < 0) return "Size unavailable";
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}
