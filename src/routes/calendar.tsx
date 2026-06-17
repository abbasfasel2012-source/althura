import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { fetchExams, fetchEvents, ar } from "@/lib/data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | التقويم" },
      { name: "description", content: "تقويم شهري للامتحانات والفعاليات." },
    ],
  }),
  component: CalendarPage,
});

const WEEK = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

type Mark = { kind: "exam" | "event"; label: string };

function CalendarPage() {
  const examsQ = useQuery({ queryKey: ["exams"], queryFn: fetchExams });
  const eventsQ = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthLabel = now.toLocaleDateString("ar-IQ", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const { marks, upcoming } = useMemo(() => {
    const marks = new Map<number, Mark[]>();
    const upcoming: { day: number; date: Date; label: string; kind: "exam" | "event" }[] = [];

    const add = (date: Date, label: string, kind: "exam" | "event") => {
      if (date.getFullYear() !== year || date.getMonth() !== month) return;
      const d = date.getDate();
      const arr = marks.get(d) ?? [];
      arr.push({ kind, label });
      marks.set(d, arr);
      if (d >= today) upcoming.push({ day: d, date, label, kind });
    };

    (examsQ.data ?? []).forEach((e) => add(new Date(e.exam_date), e.title, "exam"));
    (eventsQ.data ?? []).forEach((e) => { if (e.starts_at) add(new Date(e.starts_at), e.title, "event"); });

    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    return { marks, upcoming };
  }, [examsQ.data, eventsQ.data, year, month, today]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isLoading = examsQ.isLoading || eventsQ.isLoading;

  return (
    <AppShell title="التقويم">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">هذا الشهر</div>
        <h1 className="text-2xl font-bold">{monthLabel}</h1>
      </div>

      <Card className="!p-3 mb-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK.map((w) => (
            <div key={w} className="text-center text-[10px] font-bold text-muted-foreground py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const m = marks.get(d);
            const isToday = d === today;
            const isExam = m?.some((x) => x.kind === "exam");
            const isEvent = m?.some((x) => x.kind === "event");
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl grid place-items-center text-xs font-mono font-bold relative ${
                  isToday ? "bg-accent text-accent-foreground" : m ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                }`}
              >
                {ar(d)}
                {(isExam || isEvent) && !isToday && (
                  <span className={`absolute bottom-1 size-1 rounded-full ${isExam ? "bg-destructive" : "bg-primary"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" /> امتحان</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> فعالية</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> اليوم</span>
        </div>
      </Card>

      <SectionTitle eyebrow="قادمة" title="مواعيد الأيام القادمة" />
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : upcoming.length === 0 ? (
        <Card className="text-center py-10 text-sm text-muted-foreground">لا توجد مواعيد قادمة هذا الشهر.</Card>
      ) : (
        <div className="space-y-2">
          {upcoming.map((d, i) => (
            <Card key={i} className="!p-3 flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center font-mono font-bold">{ar(d.day)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{d.label}</div>
                <div className="text-[11px] text-muted-foreground">{d.kind === "exam" ? "اختبار" : "فعالية"}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
