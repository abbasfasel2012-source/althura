import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { useUser } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  fetchAdminStats, fetchAnnouncements, fetchGroups, ar,
  fetchTodayPeriods, fetchUpcomingExamsCount, fetchMyHomework,
} from "@/lib/data";
import {
  ArrowLeft, BookOpen, CalendarClock, ClipboardList, GraduationCap,
  Megaphone, MessagesSquare, Sparkles, Wrench,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ثانوية الذرى الذكية | الرئيسية" },
      { name: "description", content: "اللوحة الرئيسية للطالب — جدول اليوم، الواجبات، الامتحانات، والتبليغات." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const user = useUser();
  const { userId, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Hooks: declare all before any early return.
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const groupsQ = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const annsQ = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const periodsQ = useQuery({ queryKey: ["today-periods"], queryFn: fetchTodayPeriods });
  const examsCountQ = useQuery({ queryKey: ["exams-upcoming"], queryFn: fetchUpcomingExamsCount });
  const homeworkQ = useQuery({
    queryKey: ["my-homework", userId],
    queryFn: () => fetchMyHomework(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (authLoading) return;
    if (user === null) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  if (authLoading && user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const latestAnn = annsQ.data?.[0];
  const name = user?.fullName?.split(" ")[0] ?? "زائر";
  const isGuest = user?.role === "guest";
  const isOwner = user?.role === "owner";

  const periods = periodsQ.data ?? [];
  const nowClass = periods[0];
  const openHomework = (homeworkQ.data ?? []).filter((h) => !h.done);
  const booksCount = stats.data?.books ?? 0;
  const examsCount = examsCountQ.data ?? 0;
  const groupsCount = groupsQ.data?.length ?? 0;

  return (
    <AppShell title="الرئيسية">
      <section className="mb-5 animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          {new Date().toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h1 className="text-3xl font-bold leading-tight">
          {isGuest ? (
            <>أهلاً بك في <span className="text-primary">الذرى</span></>
          ) : isOwner ? (
            <>لوحة <span className="text-primary">المالك</span></>
          ) : (
            <>أهلاً، <span className="text-primary">{name}</span></>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isGuest
            ? "تتصفّح كضيف — يظهر لك المحتوى العام فقط."
            : isOwner
            ? "إدارة المنصة، الطلبة، والتبليغات من مكان واحد."
            : "لديك مسار تعليمي حافل اليوم. ركّز، واستمتع."}
        </p>

        {isOwner && (
          <Link to="/admin" className="mt-4 rounded-2xl p-4 bg-accent text-accent-foreground shadow-glass flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.2em] opacity-70 font-bold uppercase">إدارة</div>
              <div className="font-bold text-base mt-0.5">فتح لوحة التحكم</div>
            </div>
            <ArrowLeft className="size-5" />
          </Link>
        )}

        {!isGuest && !isOwner && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl p-4 bg-accent text-accent-foreground relative overflow-hidden">
              <div className="text-[11px] opacity-70 font-medium">الواجبات</div>
              <div className="text-3xl font-mono font-bold mt-1">
                {ar(String(openHomework.length).padStart(2, "0"))}
              </div>
              <ClipboardList className="absolute -bottom-2 -left-2 size-16 opacity-10" />
            </div>
            <div className="rounded-2xl p-4 glass border border-border">
              <div className="text-[11px] text-muted-foreground font-medium">الامتحانات</div>
              <div className="text-3xl font-mono font-bold mt-1 text-primary">
                {ar(String(examsCount).padStart(2, "0"))}
              </div>
              <GraduationCap className="absolute opacity-0" />
            </div>
          </div>
        )}
      </section>

      {isGuest && (
        <section className="grid grid-cols-2 gap-3 mb-6 animate-reveal [animation-delay:80ms]">
          <Link to="/announcements" className="glass rounded-2xl p-4 col-span-2 flex items-center gap-3">
            <Megaphone className="size-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">آخر تبليغ</div>
              <div className="text-sm font-bold truncate">{latestAnn?.title ?? "لا توجد تبليغات"}</div>
            </div>
          </Link>
          <Link to="/books" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <BookOpen className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">المكتبة</div>
            <div className="text-[11px] text-muted-foreground">كتب وفيديوهات</div>
          </Link>

          <Link to="/news" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <Megaphone className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">الأخبار</div>
            <div className="text-[11px] text-muted-foreground">آخر مستجدات</div>
          </Link>
          <Link to="/events" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <CalendarClock className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">الفعاليات</div>
            <div className="text-[11px] text-muted-foreground">القادمة</div>
          </Link>
          <Link to="/contact" className="glass rounded-2xl p-4 flex flex-col gap-1">
            <MessagesSquare className="size-5 text-primary" />
            <div className="font-bold text-sm mt-2">تواصل</div>
            <div className="text-[11px] text-muted-foreground">مع الإدارة</div>
          </Link>
          <Link to="/login" className="col-span-2 rounded-2xl p-4 bg-accent text-accent-foreground text-center font-bold text-sm">
            سجّل حساب طالب للوصول الكامل
          </Link>
        </section>
      )}

      {!isGuest && (
        <>
          <section className="grid grid-cols-6 gap-3 auto-rows-[110px]">
            {/* Today schedule */}
            <Link to="/schedule" className="col-span-6 row-span-2 glass rounded-3xl p-5 shadow-soft relative overflow-hidden animate-reveal [animation-delay:80ms]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">جدول اليوم</div>
                  <h3 className="text-lg font-bold">{nowClass?.subject ?? "لا يوجد جدول اليوم"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nowClass ? `${nowClass.room ?? ""}${nowClass.room ? " • " : ""}${nowClass.start_time}` : "تواصل مع الإدارة لإضافة الجدول"}
                  </p>
                </div>
                {nowClass && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">اليوم</span>}
              </div>
              <div className="space-y-2.5">
                {periods.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="font-mono text-xs text-muted-foreground w-10">{c.start_time}</div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-sm font-medium">{c.subject}</div>
                  </div>
                ))}
                {periods.length === 0 && !periodsQ.isLoading && (
                  <div className="text-xs text-muted-foreground">— لم يُضف بعد —</div>
                )}
              </div>
              <div className="ink-watermark">٠١</div>
            </Link>

            {/* AI */}
            <Link to="/ai" className="col-span-4 row-span-2 rounded-3xl p-5 bg-accent text-accent-foreground shadow-glass flex flex-col justify-between relative overflow-hidden animate-reveal [animation-delay:140ms]">
              <div className="size-9 grid place-items-center rounded-xl bg-white/15">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">مساعد عبوسي</h3>
                <p className="text-[11px] opacity-80 mt-1">اسألني عن أي درس أو واجب.</p>
                <div className="flex items-center gap-1 text-[11px] mt-3 text-primary">
                  ابدأ المحادثة <ArrowLeft className="size-3" />
                </div>
              </div>
            </Link>

            {/* Latest announcement */}
            <Link to="/announcements" className="col-span-2 row-span-2 glass rounded-3xl p-3 flex flex-col items-center text-center justify-center animate-reveal [animation-delay:200ms]">
              <div className="size-8 rounded-full bg-amber-50 grid place-items-center mb-2">
                <Megaphone className="size-4 text-amber-700" />
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1">تنبيه</div>
              <div className="text-[11px] font-medium leading-tight px-1 line-clamp-3">
                {latestAnn?.title ?? "لا تبليغات"}
              </div>
            </Link>

            <Link to="/books" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:240ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> المكتبة
              </span>
              <span className="font-mono font-bold text-lg">
                {stats.isLoading ? "…" : ar(String(booksCount).padStart(2, "0"))}
              </span>
            </Link>


            <Link to="/exams" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:280ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" /> اختبارات
              </span>
              <span className="font-mono font-bold text-lg text-accent">{ar(String(examsCount).padStart(2, "0"))}</span>
            </Link>

            <Link to="/messages" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:290ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <MessagesSquare className="size-4 text-primary" /> تواصل
              </span>
              <span className="text-[11px] text-primary font-bold">فتح</span>
            </Link>

            <Link to="/grades" className="col-span-3 glass rounded-2xl p-4 flex items-center justify-between animate-reveal [animation-delay:300ms]">
              <span className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" /> الدرجات
              </span>
              <span className="text-[11px] text-primary font-bold">عرض</span>
            </Link>


            {/* Homework */}
            <Link to="/homework" className="col-span-6 row-span-2 glass rounded-3xl p-5 shadow-soft flex flex-col justify-between animate-reveal [animation-delay:320ms]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">آخر الواجبات</h3>
                <span className="text-[11px] text-primary">عرض الكل</span>
              </div>
              <div className="space-y-2.5 mt-3">
                {openHomework.slice(0, 3).map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-accent" />
                    <div className="text-sm">{h.title}</div>
                    <div className="text-[10px] text-muted-foreground mr-auto">
                      {h.due_date ? new Date(h.due_date).toLocaleDateString("ar-IQ", { month: "short", day: "numeric" }) : ""}
                    </div>
                  </div>
                ))}
                {openHomework.length === 0 && !homeworkQ.isLoading && (
                  <div className="text-xs text-muted-foreground">لا توجد واجبات مفتوحة 🎉</div>
                )}
              </div>
            </Link>

            {/* Groups */}
            <Link to="/groups" className="col-span-3 row-span-2 glass rounded-3xl p-4 flex flex-col justify-between animate-reveal [animation-delay:380ms]">
              <MessagesSquare className="size-5 text-primary" />
              <div>
                <div className="font-bold text-sm">الكروبات</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{groupsQ.isLoading ? "…" : ar(groupsCount)} كروبات نشطة</div>
              </div>
            </Link>

            {/* Tools */}
            <Link to="/tools" className="col-span-3 row-span-2 rounded-3xl p-4 bg-accent/5 border border-accent/15 flex flex-col justify-between animate-reveal [animation-delay:420ms]">
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
                { to: "/grades", label: "الدرجات" },
                { to: "/calendar", label: "التقويم" },
                { to: "/teachers", label: "المدرّسون" },
                { to: "/news", label: "الأخبار" },
                { to: "/events", label: "الفعاليات" },
                { to: "/contact", label: "تواصل" },
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
