import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { CALENDAR_DAYS, ar } from "@/lib/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | التقويم" },
      { name: "description", content: "تقويم شهري للامتحانات والفعاليات." },
    ],
  }),
  component: CalendarPage,
});

const DAYS_IN_MONTH = 31;
const FIRST_WEEKDAY = 2; // Monday
const WEEK = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

function CalendarPage() {
  const marks = new Map<number, { kind: "today" | "exam" | "event"; label: string }>();
  for (const d of CALENDAR_DAYS) {
    if (!marks.has(d.day) || d.kind === "today") marks.set(d.day, { kind: d.kind, label: d.label });
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < FIRST_WEEKDAY; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);

  return (
    <AppShell title="التقويم">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          هذا الشهر
        </div>
        <h1 className="text-2xl font-bold">تشرين الأول ٢٠٢٦</h1>
      </div>

      <Card className="!p-3 mb-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK.map((w) => (
            <div key={w} className="text-center text-[10px] font-bold text-muted-foreground py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const m = marks.get(d);
            const isToday = m?.kind === "today";
            const isExam = m?.kind === "exam";
            const isEvent = m?.kind === "event";
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl grid place-items-center text-xs font-mono font-bold relative ${
                  isToday
                    ? "bg-accent text-accent-foreground"
                    : m
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {ar(d)}
                {(isExam || isEvent) && !isToday && (
                  <span
                    className={`absolute bottom-1 size-1 rounded-full ${
                      isExam ? "bg-destructive" : "bg-primary"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" /> امتحان
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> فعالية
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" /> اليوم
          </span>
        </div>
      </Card>

      <SectionTitle eyebrow="قادمة" title="مواعيد الأيام القادمة" />
      <div className="space-y-2">
        {CALENDAR_DAYS.filter((d) => d.kind !== "today").map((d, i) => (
          <Card key={i} className="!p-3 flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center font-mono font-bold">
              {ar(d.day)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{d.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {d.kind === "exam" ? "اختبار" : "فعالية"}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
