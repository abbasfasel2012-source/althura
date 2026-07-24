import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Home, CalendarDays, BookOpen, User2, Search, LogOut, Sparkles, Sun, Moon } from "lucide-react";
import { useUser } from "@/lib/store";
import { signOut } from "@/lib/auth";
import { useHasUnreadNotifications, markNotificationsSeen } from "@/lib/notifications";
import { useTheme } from "@/lib/theme";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/schedule", label: "الجدول", icon: CalendarDays },
  { to: "/ai", label: "عبوسي", icon: Sparkles },
  { to: "/books", label: "المكتبة", icon: BookOpen },
  { to: "/profile", label: "حسابي", icon: User2 },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasUnread = useHasUnreadNotifications();
  const { resolved, toggle } = useTheme();


  return (
    <div className="min-h-dvh overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <div className="glass-strong rounded-2xl px-3 py-2 flex items-center justify-between shadow-soft">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="size-9 shrink-0 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold">
              ذ
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground -mb-0.5">الذرى الذكية</div>
              <div className="text-sm font-bold truncate">{title ?? "الرئيسية"}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggle}
              aria-label={resolved === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
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
      </header>

      <main className="min-w-0 px-4 pt-2">{children}</main>

      <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-50">
        <div className="glass-strong rounded-2xl px-2 py-2 shadow-glass flex items-center justify-between">
          {NAV.map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-bold">{n.label}</span>
              </Link>
            );
          })}
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
      className={`glass rounded-3xl p-5 shadow-soft relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
