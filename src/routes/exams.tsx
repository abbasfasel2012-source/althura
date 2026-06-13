import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { EXAMS } from "@/lib/store";
import { CalendarClock } from "lucide-react";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | جدول الامتحانات" },
      { name: "description", content: "كل امتحاناتك القادمة في مكان واحد." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  return (
    <AppShell title="الامتحانات">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          القادمة
        </div>
        <h1 className="text-2xl font-bold">{EXAMS.length} امتحانات قريبة</h1>
      </div>

      <div className="space-y-3 mt-5">
        {EXAMS.map((e, i) => (
          <Card key={i} className="animate-reveal" >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
                  {e.subject}
                </div>
                <h3 className="font-bold truncate">{e.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                  <CalendarClock className="size-3" /> {e.date}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-3xl font-mono font-bold text-accent">
                  {String(e.daysLeft).padStart(2, "٠")}
                </div>
                <div className="text-[10px] text-muted-foreground">يوم</div>
              </div>
            </div>
            <div className="ink-watermark">{String(i + 1).padStart(2, "٠")}</div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
