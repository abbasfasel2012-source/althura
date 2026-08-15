import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { fetchWeekSchedule, fetchDayPeriods, type SchedulePeriod } from "@/lib/data";
import { Loader2, Palmtree, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SkList } from "@/components/Skeletons";
import { exportScheduleToIcs } from "@/lib/ics-export";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | جدول الدروس" },
      { name: "description", content: "جدول الدروس الأسبوعي مع تفاصيل دقيقة لكل حصة." },
      { property: "og:title", content: "الذرى الذكية | جدول الدروس" },
      { property: "og:description", content: "جدول الدروس الأسبوعي مع تفاصيل دقيقة لكل حصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const today = new Date().getDay(); // 0..6
  const [dayIdx, setDayIdx] = useState(today);
  const [exporting, setExporting] = useState(false);

  const daysQ = useQuery({ queryKey: ["week-schedule"], queryFn: fetchWeekSchedule });
  const days = daysQ.data ?? [];
  const selectedDay = days.find((d) => d.day_index === dayIdx) ?? days[dayIdx];

  const periodsQ = useQuery({
    queryKey: ["day-periods", selectedDay?.id],
    queryFn: () => fetchDayPeriods(selectedDay!.id),
    enabled: !!selectedDay && !selectedDay.is_holiday,
  });
  const periods = periodsQ.data ?? [];

  async function handleExport() {
    if (exporting || days.length === 0) return;
    setExporting(true);
    try {
      const entries = await Promise.all(
        days.filter((d) => !d.is_holiday).map(async (d) => [d.id, await fetchDayPeriods(d.id)] as const),
      );
      const map = new Map<string, SchedulePeriod[]>(entries);
      exportScheduleToIcs(days, map);
      toast.success("تم تحميل ملف الجدول", { description: "افتحه من تطبيق التقويم عندك لإضافته" });
    } catch {
      toast.error("ما قدرنا نصدّر الجدول", { description: "جرّب مرة ثانية" });
    } finally {
      setExporting(false);
    }
  }

  if (daysQ.isLoading) {
    return (
      <AppShell title="جدول الدروس">
        <SkList rows={5} />
      </AppShell>
    );
  }

  const isHoliday = selectedDay?.is_holiday;
  const holidayLabel = selectedDay?.holiday_label ?? "عطلة";
  const dayName = selectedDay?.day_name ?? "—";

  return (
    <AppShell title="جدول الدروس">
      <div className="animate-reveal flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">أسبوع الدراسة</div>
          <h1 className="text-2xl font-bold">{dayName}</h1>
        </div>
        {days.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-2/60 text-xs font-bold text-foreground disabled:opacity-60"
          >
            {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            إضافة للتقويم
          </button>
        )}
      </div>

      {days.length === 0 ? (
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">
          لم يتم إعداد الجدول الأسبوعي بعد — يمكن للإدارة إضافته من لوحة التحكم.
        </Card>
      ) : (
        <>
          {/* Day pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => setDayIdx(d.day_index)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
                  d.day_index === dayIdx
                    ? "bg-accent text-accent-foreground border-accent"
                    : d.is_holiday
                    ? "bg-surface-2 text-muted-foreground border-border opacity-50"
                    : "bg-surface-2 text-muted-foreground border-border"
                }`}
              >
                {d.day_name}
                {d.is_holiday && " 🌴"}
              </button>
            ))}
          </div>

          {isHoliday && (
            <div className="mt-6 animate-reveal">
              <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <Palmtree className="size-12 text-primary opacity-60" />
                <div className="text-xl font-bold">{holidayLabel}</div>
                <div className="text-sm text-muted-foreground">استمتع بيومك 🎉</div>
              </div>
            </div>
          )}

          {!isHoliday && periods.length > 0 && (
            <div
              className="mt-4 animate-reveal [animation-delay:30ms] rounded-3xl p-5 shadow-glass relative overflow-hidden"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.2em] opacity-80 font-bold uppercase">أول حصة</div>
                  <div className="text-xl font-bold mt-1">{periods[0]?.subject}</div>
                  <div className="text-xs opacity-90 mt-1">{periods[0]?.room ?? "—"}</div>
                </div>
                <div className="text-3xl font-mono font-bold">{periods[0]?.start_time}</div>
              </div>
            </div>
          )}

          {!isHoliday && (
            <div className="mt-4 relative">
              {periodsQ.isLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}

              {!periodsQ.isLoading && periods.length === 0 && (
                <Card className="text-center text-xs text-muted-foreground py-8">
                  لا توجد حصص محددة لهذا اليوم.
                </Card>
              )}

              {periods.length > 0 && (
                <>
                  <div className="absolute right-[58px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-3">
                    {periods.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-stretch gap-3 animate-reveal"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="w-12 shrink-0 text-left font-mono text-xs text-muted-foreground pt-3">
                          {p.start_time}
                        </div>
                        <div className="relative">
                          <div className="size-2.5 rounded-full bg-primary border-2 border-background mt-4" />
                        </div>
                        <div className="flex-1 glass rounded-2xl p-4">
                          <div className="font-bold text-sm text-foreground">{p.subject}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.teacher && <span>{p.teacher} • </span>}
                            {p.room ? p.room : "مدة الحصة: ٤٥ دقيقة"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
