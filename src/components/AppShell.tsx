import { Link, useLocation, useNavigate, useRouterState, useRouter } from "@tanstack/react-router";
import { Bell, Home, CalendarDays, BookOpen, User2, Search, LogOut, Sparkles, Sun, Moon, WifiOff, ChevronLeft } from "lucide-react";
import { useUser } from "@/lib/store";
import { signOut } from "@/lib/auth";
import { useHasUnreadNotifications, markNotificationsSeen } from "@/lib/notifications";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { to: "/", key: "nav.home", icon: Home, match: ["/"] },
  {
    to: "/schedule",
    key: "nav.schedule",
    icon: CalendarDays,
    match: ["/schedule", "/calendar", "/homework", "/exams", "/grades"],
  },
  { to: "/ai", key: "nav.ai", icon: Sparkles, match: ["/ai", "/tools"] },
  { to: "/books", key: "nav.library", icon: BookOpen, match: ["/books", "/videos"] },
  {
    to: "/profile",
    key: "nav.profile",
    icon: User2,
    match: ["/profile", "/settings", "/messages", "/groups", "/dm", "/teachers", "/admin"],
  },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")));
}

// Light haptic feedback on tab taps (Android/Chrome; silently ignored elsewhere).
function tap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(8); } catch { /* ignore */ }
  }
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const user = useUser();
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const hasUnread = useHasUnreadNotifications();
  const { resolved, toggle } = useTheme();
  const { t } = useI18n();
  const isNavigating = useRouterState({ select: (s) => s.status === "pending" });
  const [offline, setOffline] = useState(false);

  // Top-level tabs keep their own scroll position (handled by the router);
  // inner pages always start at the top.
  const isTab = NAV.some((n) => n.to === location.pathname);
  useEffect(() => {
    if (!isTab) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, isTab]);

  // Offline awareness.
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);


  return (
    <div className="min-h-dvh overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {isNavigating && <div className="route-progress" />}

      <header className="sticky top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <div className="glass-strong rounded-2xl px-3 py-2 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2 min-w-0">
            {!isTab && (
              <button
                type="button"
                onClick={() => {
                  tap();
                  if (window.history.length > 1) router.history.back();
                  else navigate({ to: "/" });
                }}
                aria-label="رجوع"
                className="size-9 shrink-0 grid place-items-center rounded-xl border border-border bg-surface-2/60 press"
              >
                <ChevronLeft className="size-4 rotate-180" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <div className="size-9 shrink-0 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold">
                ذ
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground -mb-0.5">{t("app.name")}</div>
                <div className="text-sm font-bold truncate">{title ?? t("nav.home")}</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggle}
              aria-label={resolved === "dark" ? t("a11y.light") : t("a11y.dark")}
              className="relative size-9 grid place-items-center rounded-xl border border-border bg-surface-2/60 overflow-hidden"
            >
              <Sun className={`size-4 absolute transition-all duration-500 ${resolved === "dark" ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
              <Moon className={`size-4 absolute transition-all duration-500 ${resolved === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
            </button>
            <Link
              to="/search"
              aria-label="بحث"
              className="size-9 grid place-items-center rounded-xl border border-border bg-surface-2/60"
            >
              <Search className="size-4" />
            </Link>
            <Link
              to="/announcements"
              aria-label="الإشعارات"
              onClick={() => markNotificationsSeen()}
              className="size-9 grid place-items-center rounded-xl border border-border bg-surface-2/60 relative"
            >
              <Bell className="size-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              )}
            </Link>
            {user && user.role !== "guest" ? (
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
                }}
                aria-label="خروج"
                className="size-9 grid place-items-center rounded-xl border border-border bg-surface-2/60"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        {offline && (
          <div className="mt-2 rounded-xl px-3 py-1.5 bg-destructive/15 text-destructive text-[11px] font-bold flex items-center gap-2 animate-pop">
            <WifiOff className="size-3.5" /> لا يوجد اتصال بالإنترنت
          </div>
        )}
      </header>


      <main className="min-w-0 px-4 pt-2">{children}</main>

      <nav className="app-bottom-nav fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-50">
        <div className="bottom-bar rounded-2xl px-2 py-2 shadow-glass relative">
          {activeIndex >= 0 && (
            <span
              aria-hidden
              className="absolute top-2 bottom-2 rounded-xl bg-accent transition-[inset-inline-start] duration-300 ease-out"
              style={{
                width: `calc(${100 / NAV.length}% - 0.5rem)`,
                insetInlineStart: `calc(${(activeIndex * 100) / NAV.length}% + 0.25rem)`,
              }}
            />
          )}
          <div className="relative flex items-stretch justify-between">
            {NAV.map((n) => {
              const active = isActive(location.pathname, n.match);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={tap}
                  preload="intent"
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 min-h-11 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl press transition-colors ${
                    active ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`size-[18px] transition-transform duration-300 ${active ? "scale-110 -translate-y-px" : ""}`}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  <span className="text-[10px] font-bold">{t(n.key)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        {eyebrow ? (
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-1">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass rounded-3xl p-5 shadow-soft relative overflow-hidden hover-lift ${className}`}
    >
      {children}
    </div>
  );
}
