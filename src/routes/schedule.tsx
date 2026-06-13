import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { TODAY_SCHEDULE, WEEK_SCHEDULE } from "@/lib/store";

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
  const [day, setDay] = useState(1);

  return (
    <AppShell title="جدول الدروس">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          أسبوع الدراسة
        </div>
        <h1 className="text-2xl font-bold">{WEEK_SCHEDULE[day].day}</h1>
      </div>

      {/* Day pills */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {WEEK_SCHEDULE.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setDay(i)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
              i === day
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface-2 text-muted-foreground border-border"
            }`}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Now Card */}
      {day === 1 && (
        <div
          className="mt-4 animate-reveal [animation-delay:80ms] rounded-3xl p-5 shadow-glass relative overflow-hidden"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.2em] opacity-80 font-bold uppercase">
                الحصة الحالية
              </div>
              <div className="text-xl font-bold mt-1">
                {TODAY_SCHEDULE.find((c) => c.status === "now")?.subject}
              </div>
              <div className="text-xs opacity-90 mt-1">
                {TODAY_SCHEDULE.find((c) => c.status === "now")?.room}
              </div>
            </div>
            <div className="text-3xl font-mono font-bold">
              {TODAY_SCHEDULE.find((c) => c.status === "now")?.time}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-4 relative">
        <div className="absolute right-[58px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-3">
          {WEEK_SCHEDULE[day].items.map((it, i) => (
            <div key={i} className="flex items-stretch gap-3 animate-reveal" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-12 shrink-0 text-left font-mono text-xs text-muted-foreground pt-3">
                {it.time}
              </div>
              <div className="relative">
                <div className="size-2.5 rounded-full bg-primary border-2 border-background mt-4" />
              </div>
              <div className="flex-1 glass rounded-2xl p-4">
                <div className="font-bold text-sm">{it.subject}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  مدة الحصة: ٤٥ دقيقة
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
