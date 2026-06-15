import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { fetchWeekSchedule, fetchDayPeriods } from "@/lib/data";
import { TODAY_SCHEDULE } from "@/lib/store";
import { Loader2, Palmtree } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | جدول الدروس" },
      { name: "description", content: "جدول الدروس الأسبوعي مع تفاصيل دقيقة لكل حصة." },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const [dayIdx, setDayIdx] = useState(1); // الاثنين افتراضياً

  const daysQ = useQuery({ queryKey: ["week-schedule"], queryFn: fetchWeekSchedule });
  const days = daysQ.data ?? [];
  const selectedDay = days[dayIdx];

  const periodsQ = useQuery({
    queryKey: ["day-periods", selectedDay?.id],
    queryFn: () => fetchDayPeriods(selectedDay!.id),
    enabled: !!selectedDay && !selectedDay.is_holiday,
  });
  const periods = periodsQ.data ?? [];

  // fallback لو قاعدة البيانات فارغة
  const useFallback = !daysQ.isLoading && days.length === 0;

  if (daysQ.isLoading) {
    return (
      <AppShell title="جدول الدروس">
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const dayName = useFallback
    ? ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"][dayIdx] ?? "الاثنين"
    : selectedDay?.day_name ?? "—";

  const isHoliday = !useFallback && selectedDay?.is_holiday;
  const holidayLabel = selectedDay?.holiday_label ?? "عطلة";

  return (
    <AppShell title="جدول الدروس">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          أسبوع الدراسة
        </div>
        <h1 className="text-2xl font-bold">{dayName}</h1>
      </div>

      {/* Day pills */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {useFallback
          ? ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"].map((d, i) => (
              <button
                key={d}
                onClick={() => setDayIdx(i)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
                  i === dayIdx
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-surface-2 text-muted-foreground border-border"
                }`}
              >
                {d}
              </button>
            ))
          : days.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setDayIdx(i)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
                  i === dayIdx
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

      {/* عطلة */}
      {isHoliday && (
        <div className="mt-6 animate-reveal">
          <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
            <Palmtree className="size-12 text-primary opacity-60" />
            <div className="text-xl font-bold">{holidayLabel}</div>
            <div className="text-sm text-muted-foreground">استمتع بيومك 🎉</div>
          </div>
        </div>
      )}

      {/* Now Card — اليوم الحالي فقط */}
      {!isHoliday && dayIdx === 1 && (useFallback || periods.length > 0) && (
        <div
          className="mt-4 animate-reveal [animation-delay:80ms] rounded-3xl p-5 shadow-glass relative overflow-hidden"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.2em] opacity-80 font-bold uppercase">الحصة الحالية</div>
              <div className="text-xl font-bold mt-1">
                {useFallback
                  ? TODAY_SCHEDULE.find((c) => c.status === "now")?.subject
                  : periods[1]?.subject ?? periods[0]?.subject ?? "—"}
              </div>
              <div className="text-xs opacity-90 mt-1">
                {useFallback
                  ? TODAY_SCHEDULE.find((c) => c.status === "now")?.room
                  : periods[1]?.room ?? "—"}
              </div>
            </div>
            <div className="text-3xl font-mono font-bold">
              {useFallback
                ? TODAY_SCHEDULE.find((c) => c.status === "now")?.time
                : periods[1]?.start_time ?? periods[0]?.start_time ?? "—"}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isHoliday && (
        <div className="mt-4 relative">
          {periodsQ.isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}

          {/* Fallback: بيانات محلية */}
          {useFallback && (
            <FallbackTimeline dayIdx={dayIdx} />
          )}

          {/* Real data */}
          {!useFallback && !periodsQ.isLoading && periods.length === 0 && (
            <Card className="text-center text-xs text-muted-foreground py-8">
              لا توجد حصص محددة لهذا اليوم — يمكن للأدمن إضافتها من لوحة التحكم.
            </Card>
          )}

          {!useFallback && periods.length > 0 && (
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
    </AppShell>
  );
}

function FallbackTimeline({ dayIdx }: { dayIdx: number }) {
  const FALLBACK = [
    [{ time: "٠٨:٠٠", subject: "اللغة العربية" }, { time: "٠٩:٠٠", subject: "الإسلامية" }, { time: "١٠:٣٠", subject: "الرياضيات" }],
    [{ time: "٠٨:٠٠", subject: "اللغة العربية" }, { time: "٠٩:٠٠", subject: "الفيزياء" }, { time: "١٠:٣٠", subject: "الرياضيات" }, { time: "١٢:٠٠", subject: "الإنجليزية" }],
    [{ time: "٠٨:٠٠", subject: "الكيمياء" }, { time: "٠٩:٠٠", subject: "الأحياء" }, { time: "١٠:٣٠", subject: "اللغة العربية" }],
    [{ time: "٠٨:٠٠", subject: "الفيزياء" }, { time: "٠٩:٠٠", subject: "الرياضيات" }, { time: "١٠:٣٠", subject: "الإسلامية" }],
    [{ time: "٠٨:٠٠", subject: "الإنجليزية" }, { time: "٠٩:٠٠", subject: "الحاسوب" }, { time: "١٠:٣٠", subject: "الرياضة" }],
  ];
  const items = FALLBACK[dayIdx] ?? FALLBACK[1];
  return (
    <>
      <div className="absolute right-[58px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-stretch gap-3 animate-reveal" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-12 shrink-0 text-left font-mono text-xs text-muted-foreground pt-3">{it.time}</div>
            <div className="relative">
              <div className="size-2.5 rounded-full bg-primary border-2 border-background mt-4" />
            </div>
            <div className="flex-1 glass rounded-2xl p-4">
              <div className="font-bold text-sm text-foreground">{it.subject}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">مدة الحصة: ٤٥ دقيقة</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
