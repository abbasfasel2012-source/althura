import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, Loader2 } from "lucide-react";
import { ar } from "@/lib/data";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | جدول الامتحانات" },
      { name: "description", content: "كل امتحاناتك القادمة في مكان واحد." },
    ],
  }),
  component: ExamsPage,
});

interface Exam {
  id: string;
  title: string;
  subject: string;
  exam_date: string;
  description: string | null;
  created_at: string;
}

async function fetchExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Exam[];
}

function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function ExamsPage() {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: fetchExams,
  });

  if (isLoading) {
    return (
      <AppShell title="الامتحانات">
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="الامتحانات">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          القادمة
        </div>
        <h1 className="text-2xl font-bold">
          {exams.length > 0 ? `${ar(exams.length)} امتحانات قريبة` : "الامتحانات"}
        </h1>
      </div>

      {exams.length === 0 && (
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">
          لا توجد امتحانات مجدولة حالياً.
        </Card>
      )}

      <div className="space-y-3 mt-5">
        {exams.map((e, i) => {
          const days = daysLeft(e.exam_date);
          return (
            <Card key={e.id} className="animate-reveal">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
                    {e.subject}
                  </div>
                  <h3 className="font-bold truncate">{e.title}</h3>
                  {e.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{e.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <CalendarClock className="size-3" />
                    {new Date(e.exam_date).toLocaleDateString("ar-IQ", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`text-3xl font-mono font-bold ${days <= 3 ? "text-destructive" : "text-accent"}`}>
                    {ar(String(days).padStart(2, "0"))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">يوم</div>
                </div>
              </div>
              <div className="ink-watermark">{ar(String(i + 1).padStart(2, "0"))}</div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
