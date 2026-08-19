import { Link, useLocation, useNavigate, useRouterState, useRouter } from "@tanstack/react-router";
import { Bell, Home, CalendarDays, BookOpen, User2, Search, LogOut, Sparkles, Sun, Moon, WifiOff, ChevronLeft } from "lucide-react";
import { useUser } from "@/lib/store";
import { signOut } from "@/lib/auth";
import { useHasUnreadNotifications, markNotificationsSeen } from "@/lib/notifications";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

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
  // شريط التحميل يظهر فقط لو التنقل أخذ أكثر من 120ms — عشان ما "يومض"
  // للحظة على الانتقالات السريعة المحمّلة مسبقاً (كان يظهر ويختفي بسرعة
  // ويحس المستخدم بومضة/كرنج بدل انتقال نظيف).
  const [showProgress, setShowProgress] = useState(false);
  useEffect(() => {
    if (!isNavigating) {
      setShowProgress(false);
      return;
    }
    const id = setTimeout(() => setShowProgress(true), 120);
    return () => clearTimeout(id);
  }, [isNavigating]);
  const [offline, setOffline] = useState(false);

  const activeIndex = NAV.findIndex((n) => isActive(location.pathname, n.match));

  // Top-level tabs keep their own scroll position (handled by the router);
  // inner pages always start at the top.
  //
  // ⚠️ كان useEffect (يشتغل بعد الرسم) يتصادم مع استعادة السكرول التلقائية
  // بالراوتر + التلاشي البصري بين الصفحتين → قفزة سكرول محسوسة أثناء
  // الانتقال (كرنج). useLayoutEffect يشتغل قبل الرسم فيصير جزء من نفس
  // اللقطة اللي يلتقطها الـ View Transition، بدون أي قفزة منفصلة بعده.
  const isTab = NAV.some((n) => n.to === location.pathname);
  useLayoutEffect(() => {
    if (!isTab) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, isTab]);

  // Offline awareness. navigator.onLine يقدر يرجع قراءة خاطئة/متذبذبة
  // للحظة وقت إقلاع التطبيق (خصوصاً لما الـ Service Worker يتسلّم السيطرة) —
  // لو عرضنا شريط "لا يوجد اتصال" فوراً، يومض ويختفي بسرعة حتى والنت شغّال.
  // الحل: مؤقت قصير — نصدّق حالة "غير متصل" فقط لو استمرت أكثر من ٨٠٠ms،
  // بينما رجوع الاتصال (online) يُطبّق فوراً بدون تأخير.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const goOnline = () => {
      clearTimer();
      setOffline(false);
    };
    const goOffline = () => {
      clearTimer();
      timer = setTimeout(() => setOffline(true), 800);
    };
    if (navigator.onLine) goOnline();
    else goOffline();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      clearTimer();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Edge swipe = go back (native feel on inner pages).
  useEffect(() => {
    if (isTab) return;
    let x0 = 0;
    let y0 = 0;
    let tracking = false;
    const onStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0) return;
      const edge = 28;
      tracking = t0.clientX <= edge || t0.clientX >= window.innerWidth - edge;
      x0 = t0.clientX;
      y0 = t0.clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t1 = e.changedTouches[0];
      if (!t1) return;
      const dx = t1.clientX - x0;
      const dy = Math.abs(t1.clientY - y0);
      if (Math.abs(dx) > 90 && dy < 60) {
        tap();
        if (window.history.length > 1) router.history.back();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isTab, router]);




  return (
    // نفس بنية الجوال بدون أي تغيير (bottom-nav + header مضغوط). التعديلات
    // الحقيقية للكومبيوتر كلها بأصناف lg: مضافة بجانبها، ما تلمس القيم الافتراضية.
    <div className="min-h-dvh overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pe-72">
      {showProgress && <div className="route-progress" />}

      {/* ============ الشريط الجانبي — كومبيوتر فقط (lg+) ============ */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:end-0 lg:w-72 lg:border-s lg:border-border lg:bg-surface/80 lg:backdrop-blur-xl lg:px-5 lg:py-6 lg:z-40">
        <Link to="/" className="flex items-center gap-3 px-1 mb-8">
          <div className="size-11 shrink-0 rounded-2xl overflow-hidden">
            <img src="/logo-classroom.jpg" alt="الذرى الذكية" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground -mb-0.5">{t("app.name")}</div>
            <div className="text-base font-bold truncate">الذرى الذكية</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground shadow-glass"
                    : "text-muted-foreground hover:bg-surface-2/70 hover:text-foreground"
                }`}
              >
                <Icon className="size-[19px]" strokeWidth={active ? 2.4 : 1.8} />
                {t(n.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 pt-4 border-t border-border">
          <Link
            to="/search"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-surface-2/70 hover:text-foreground"
          >
            <Search className="size-[18px]" /> بحث
          </Link>
          <Link
            to="/announcements"
            onClick={() => markNotificationsSeen()}
            className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-surface-2/70 hover:text-foreground"
          >
            <Bell className="size-[18px]" /> الإشعارات
            {hasUnread && <span className="absolute top-3.5 end-4 size-2 rounded-full bg-primary" />}
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-surface-2/70 hover:text-foreground"
          >
            {resolved === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            {resolved === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          </button>
          {user && user.role !== "guest" ? (
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-[18px]" /> تسجيل الخروج
            </button>
          ) : null}
        </div>
      </aside>

      {/* ============ الهيدر — نفسه بالجوال، مضغوط ومركزي بالكومبيوتر ============ */}
      <header className="sticky top-0 z-30 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 lg:hidden">
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
              <div className="size-9 shrink-0 rounded-xl overflow-hidden">
                <img src="/logo-classroom.jpg" alt="الذرى الذكية" className="size-full object-cover" />
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

      {/* عنوان الصفحة بالكومبيوتر — يعوّض الهيدر المخفي بدون تكرار أزرار الشريط الجانبي */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-10 lg:pt-8 lg:pb-2 lg:max-w-5xl lg:mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">{title ?? t("nav.home")}</h1>
        {offline && (
          <div className="rounded-xl px-3 py-1.5 bg-destructive/15 text-destructive text-xs font-bold flex items-center gap-2">
            <WifiOff className="size-3.5" /> لا يوجد اتصال بالإنترنت
          </div>
        )}
      </div>

      <main className="min-w-0 px-4 pt-2 lg:px-10 lg:pt-4 lg:pb-16 lg:max-w-5xl lg:mx-auto">{children}</main>

      <nav className="app-bottom-nav fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 lg:hidden">
        <div className="bottom-bar rounded-2xl px-2 py-2 shadow-glass relative">
          {/* خلفية التبويب النشط — ابن مباشر لنفس حاوية الأيقونات (نفس عرض
              مرجعي بالضبط، بدون فرق padding). انتقال قصير جداً (150ms)
              فقط لموقع هذا العنصر بالذات — مو انتقال صفحة كامل زي
              View Transitions القديمة. بدون هذا، القفزة بين تبويبات
              بعيدة (مثلاً الرئيسية → حسابي) تحس وكأنها "ترمي" العنصر
              فجأة لمكان بعيد. */}
          <div className="relative flex items-stretch justify-between">
            {activeIndex >= 0 && (
              <span
                aria-hidden
                className="absolute top-0 bottom-0 rounded-xl bg-accent transition-[inset-inline-start] duration-150 ease-out"
                style={{
                  width: `calc(${100 / NAV.length}% - 0.5rem)`,
                  insetInlineStart: `calc(${(activeIndex * 100) / NAV.length}% + 0.25rem)`,
                }}
              />
            )}
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
                  className={`relative flex-1 min-h-11 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl press transition-colors ${
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
