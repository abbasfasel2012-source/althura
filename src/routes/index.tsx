import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { useUser } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { fetchHomeSummary, ar } from "@/lib/data";
import { HomeSkeleton } from "@/components/Skeletons";


import {
  ArrowLeft, BookOpen, CalendarClock, ClipboardList, GraduationCap,
  Megaphone, MessagesSquare, Sparkles, Wrench,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ثانوية الذرى الذكية | الرئيسية" },
      { name: "description", content: "اللوحة الرئيسية للطالب — جدول اليوم، الواجبات، الامتحانات، والتبليغات." },
      { property: "og:title", content: "ثانوية الذرى الذكية | الرئيسية" },
      { property: "og:description", content: "اللوحة الرئيسية للطالب — جدول اليوم، الواجبات، الامتحانات، والتبليغات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const user = useUser();
  const { t, lang } = useI18n();
  const { userId, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Single request for the whole home page. Waits for the auth session so we
  // don't fire the same RPC twice (once anonymous, once authenticated).
  const homeQ = useQuery({
    queryKey: ["home-summary", userId],
    queryFn: fetchHomeSummary,
    enabled: !authLoading,
    staleTime: 60_000,
  });


  useEffect(() => {
    // Redirect only when the real auth session is resolved AND there is no
    // local (guest) user — otherwise a signed-in owner gets bounced to /login
    // on the first render (local user state hydrates one tick later).
    if (authLoading) return;
    if (!userId && user === null) navigate({ to: "/login" });
  }, [user, userId, authLoading, navigate]);

  const summary = homeQ.data;
  const latestAnn = summary?.announcements?.[0];
  const name = user?.fullName?.split(" ")[0] ?? t("common.guest");
  const isGuest = user?.role === "guest";
  const isOwner = user?.role === "owner";

  const periods = summary?.today_periods ?? [];
  const nowClass = periods[0];
  const openHomework = (summary?.homework ?? []).filter((h) => !h.done);
  const booksCount = summary?.books_count ?? 0;
  const examsCount = summary?.exams_upcoming ?? 0;
  const groupsCount = summary?.groups_count ?? 0;

  if (authLoading || (homeQ.isLoading && !summary)) {
    return (
      <AppShell title={t("nav.home")}>
        <HomeSkeleton />
      </AppShell>
    );
  }




  return (
    <AppShell title={t("nav.home")}>
      <section className="mb-5 animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          {new Date().toLocaleDateString(lang === "ar" ? "ar-IQ" : lang === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h1 className="text-3xl font-bold leading-tight">
          {isGuest ? (
            <>{t("home.welcomeGuest")} <span className="text-primary">{t("home.brand")}</span></>
          ) : isOwner ? (
            <>{t("home.ownerPanel")} <span className="text-primary">{t("home.owner")}</span></>
          ) : (
            <>{t("home.hi")} <span className="text-primary">{name}</span></>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isGuest
            ? t("home.guestSub")
            : isOwner
            ? t("home.ownerSub")
            : t("home.studentSub")}
        </p>

        {isOwner && (
          <Link to="/admin" className="mt-4 rounded-2xl p-4 bg-accent text-accent-foreground shadow-glass flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.2em] opacity-70 font-bold uppercase">{t("home.manage")}</div>
              <div className="font-bold text-base mt-0.5">{t("home.openAdmin")}</div>
            </div>
            <ArrowLeft className="size-5" />
          </Link>
        )}

        {!isGuest && !isOwner && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl p-4 bg-accent text-accent-foreground relative overflow-hidden">
              <div className="text-[11px] opacity-70 font-medium">{t("home.homework")}</div>
              <div className="text-3xl font-mono font-bold mt-1">
                {ar(String(openHomework.length).padStart(2, "0"))}
              </div>
              <ClipboardList className="absolute -bottom-2 -left-2 size-16 opacity-10" />
            </div>
            <div className="rounded-2xl p-4 glass border border-border">
              <div className="text-[11px] text-muted-foreground font-medium">{t("home.exams")}</div>
              <div className="text-3xl font-mono font-bold mt-1 text-primary">
                {ar(String(examsCount).padStart(2, "0"))}
              </div>
              <GraduationCap className="absolute opacity-0" />
            </div>
          </div>
        )}
      </section>

      {isGuest && (
        <section className="grid grid-cols-2 gap-3 mb-6 animate-reveal [animation-delay:30ms]">
          <Link to="/announcements" className="glass rounded-2xl p-4 col-span-2 flex items-center gap-3">
            <Megaphone className="size-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t("home.latestAnn")}</div>
              <div className="text-sm font-bold truncate">{latestAnn?.title ?? t("home.noAnn")}</div>
            </div>
          </Link>
          <Link to="/books" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <BookOpen className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">{t("home.library")}</div>
            <div className="text-[11px] text-muted-foreground">{t("home.librarySub")}</div>
          </Link>

          <Link to="/news" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <Megaphone className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">{t("home.news")}</div>
            <div className="text-[11px] text-muted-foreground">{t("home.newsSub")}</div>
          </Link>
          <Link to="/events" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <CalendarClock className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">{t("home.events")}</div>
            <div className="text-[11px] text-muted-foreground">{t("home.eventsSub")}</div>
          </Link>
          <Link to="/contact" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <MessagesSquare className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">{t("home.contact")}</div>
            <div className="text-[11px] text-muted-foreground">{t("home.contactSub")}</div>
          </Link>
          <Link to="/login" className="col-span-2 rounded-2xl p-4 bg-accent text-accent-foreground text-center font-bold text-sm">
            {t("home.signupCta")}
          </Link>
        </section>
      )}

      {!isGuest && (
        <>
          <section className="grid grid-cols-6 gap-3 auto-rows-[110px]">
            {/* Today schedule */}
            <Link to="/schedule" className="col-span-6 row-span-2 glass rounded-3xl p-5 shadow-soft relative overflow-hidden animate-reveal [animation-delay:30ms]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">{t("home.todaySchedule")}</div>
                  <h3 className="text-lg font-bold">{nowClass?.subject ?? t("home.noSchedule")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nowClass ? `${nowClass.room ?? ""}${nowClass.room ? " • " : ""}${nowClass.start_time}` : t("home.noScheduleHint")}
                  </p>
                </div>
                {nowClass && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{t("home.today")}</span>}
              </div>
              <div className="space-y-2.5">
                {periods.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="font-mono text-xs text-muted-foreground w-10">{c.start_time}</div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-sm font-medium">{c.subject}</div>
                  </div>
                ))}
                {periods.length === 0 && !homeQ.isLoading && (
                  <div className="text-xs text-muted-foreground">{t("home.notAdded")}</div>
                )}
              </div>
              <div className="ink-watermark">٠١</div>
            </Link>

            {/* AI */}
            <Link to="/ai" className="col-span-4 row-span-2 rounded-3xl p-5 bg-accent text-accent-foreground shadow-glass flex flex-col justify-between relative overflow-hidden animate-reveal [animation-delay:50ms]">
              <div className="size-9 grid place-items-center rounded-xl bg-accent-foreground/15">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">{t("home.aiTitle")}</h3>
                <p className="text-[11px] opacity-80 mt-1">{t("home.aiSub")}</p>
                <div className="flex items-center gap-1 text-[11px] mt-3 font-bold opacity-95">
                  {t("home.aiCta")} <ArrowLeft className="size-3" />
                </div>
              </div>
            </Link>

            {/* Latest announcement */}
            <Link to="/announcements" className="col-span-2 row-span-2 glass rounded-3xl p-3 flex flex-col items-center text-center justify-center animate-reveal [animation-delay:70ms]">
              <div className="size-8 rounded-full bg-primary/15 grid place-items-center mb-2">
                <Megaphone className="size-4 text-primary" />
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1">{t("home.alert")}</div>
              <div className="text-[11px] font-medium leading-tight px-1 line-clamp-3">
                {latestAnn?.title ?? t("home.noAnnShort")}
              </div>
            </Link>

            <Link to="/books" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:80ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> {t("home.library")}
              </span>
              <span className="font-mono font-bold text-lg">
                {homeQ.isLoading ? "…" : ar(String(booksCount).padStart(2, "0"))}
              </span>
            </Link>


            <Link to="/exams" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:90ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" /> {t("home.quizzes")}
              </span>
              <span className="font-mono font-bold text-lg text-accent">{ar(String(examsCount).padStart(2, "0"))}</span>
            </Link>

            <Link to="/messages" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:100ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <MessagesSquare className="size-4 text-primary" /> {t("home.contact")}
              </span>
              <span className="text-[11px] text-primary font-bold">{t("home.open")}</span>
            </Link>

            <Link to="/grades" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:100ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" /> {t("home.grades")}
              </span>
              <span className="text-[11px] text-primary font-bold">{t("home.view")}</span>
            </Link>


            {/* Homework */}
            <Link to="/homework" className="col-span-6 row-span-2 glass rounded-3xl p-5 shadow-soft flex flex-col justify-between animate-reveal [animation-delay:110ms]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{t("home.latestHomework")}</h3>
                <span className="text-[11px] text-primary">عرض الكل</span>
              </div>
              <div className="space-y-2.5 mt-3">
                {openHomework.slice(0, 3).map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-accent" />
                    <div className="text-sm">{h.title}</div>
                    <div className="text-[10px] text-muted-foreground mr-auto">
                      {h.due_date ? new Date(h.due_date).toLocaleDateString(lang === "ar" ? "ar-IQ" : lang === "fr" ? "fr-FR" : "en-GB", { month: "short", day: "numeric" }) : ""}
                    </div>
                  </div>
                ))}
                {openHomework.length === 0 && !homeQ.isLoading && (
                  <div className="text-xs text-muted-foreground">لا توجد واجبات مفتوحة 🎉</div>
                )}
              </div>
            </Link>

            {/* Groups */}
            <Link to="/groups" className="col-span-3 row-span-2 glass rounded-3xl p-4 flex flex-col justify-between animate-reveal [animation-delay:130ms]">
              <MessagesSquare className="size-5 text-primary" />
              <div>
                <div className="font-bold text-sm">الكروبات</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{homeQ.isLoading ? "…" : ar(groupsCount)} كروبات نشطة</div>
              </div>
            </Link>

            {/* Tools */}
            <Link to="/tools" className="col-span-3 row-span-2 rounded-3xl p-4 bg-accent/5 border border-accent/15 flex flex-col justify-between animate-reveal [animation-delay:140ms]">
              <Wrench className="size-5 text-accent" />
              <div>
                <div className="font-bold text-sm">الأدوات</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">حاسبة، ملاحظات…</div>
              </div>
            </Link>
          </section>

          <div className="mt-8">
            <SectionTitle eyebrow="استكشف" title="أقسام أخرى" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { to: "/calendar", label: "التقويم" },
                { to: "/teachers", label: "المدرّسون" },
                { to: "/news", label: "الأخبار" },
                { to: "/events", label: "الفعاليات" },
                { to: "/settings", label: "الإعدادات" },
                { to: "/announcements", label: "التبليغات" },
              ].map((s) => (
                <Link key={s.to} to={s.to}
                  className="glass rounded-2xl p-4 text-center text-sm font-bold hover:bg-surface-2 transition">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
