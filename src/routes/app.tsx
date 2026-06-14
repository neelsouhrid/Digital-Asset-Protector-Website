import { createFileRoute, Outlet, Link, redirect, useLocation, useRouter } from "@tanstack/react-router";
import { LayoutGrid, FolderLock, AlertTriangle, Globe, Bell, LogOut, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AppLayout,
});

const tabs = [
  { to: "/app/overview", label: "Overview", icon: LayoutGrid },
  { to: "/app/vault", label: "Vault", icon: FolderLock },
  { to: "/app/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/app/map", label: "Map", icon: Globe },
] as const;

function AppLayout() {
  const loc = useLocation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    staleTime: 60_000,
  });

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-user-menu]")) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const initial =
    (user?.user_metadata?.full_name as string | undefined)?.[0]?.toUpperCase() ??
    (user?.user_metadata?.name as string | undefined)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Signed in";

  async function handleSignOut() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]">
              <Shield className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Asset Vault</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden items-center gap-1 lg:flex">
            {tabs.map((t) => {
              const active = loc.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>

            <div className="relative" data-user-menu>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-border bg-white pl-1 pr-2.5 py-1 text-sm transition hover:bg-muted"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 font-semibold text-primary">
                  {initial}
                </div>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
                >
                  <div className="border-b border-border/60 px-3.5 py-3">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    {user?.email ? (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          {tabs.map((t) => {
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <t.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
