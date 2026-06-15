import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  FolderLock,
  AlertTriangle,
  Globe,
  Bell,
  ChevronDown,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileDisplayName, fetchNotifications } from "@/lib/api/data.functions";

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
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  // Resolve display name from profiles → user_metadata → email, async.
  // Synchronous fallback below renders immediately on first paint to avoid
  // a flash of "User" / "R" / email-local.
  const { data: resolvedName } = useQuery({
    queryKey: ["profile", "display-name", user.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return null;
      return fetchProfileDisplayName({ data: { accessToken: token } });
    },
    staleTime: 60_000,
  });
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const syncName =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (user.email ? user.email.split("@")[0] : "") ||
    "User";
  const displayName = resolvedName || syncName;
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["header-notifications", user.id],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return [];
      return fetchNotifications({ data: { accessToken: token } });
    },
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) await navigate({ to: "/auth", replace: true });
  };

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
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <h2 className="font-display text-sm font-bold">Notifications</h2>
                <div className="mt-3 space-y-2">
                  {notificationsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading notifications…</p>
                  ) : notifications.length ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">Asset match detected</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.location_name || "Unknown location"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No notifications available.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl px-1.5 pr-2.5"
                  aria-label="Open profile menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 font-semibold text-primary">
                    {initial}
                  </span>
                  <span className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block truncate">{displayName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <t.icon className={`h-5 w-5 ${active ? "" : ""}`} strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
