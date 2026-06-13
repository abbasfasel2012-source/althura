import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { GRADES_RESULTS, STUDENT_STATS, ar } from "@/lib/store";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export const Route = createFileRoute("/grades")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الدرجات" },
      { name: "description", content: "نتائجك ودرجاتك في كل المواد." },
    ],
  }),
  component: GradesPage,
});

function GradesPage() {
  const avg = STUDENT_STATS.average;
  return (
    <AppShell title="الدرجات">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          سجلك الأكاديمي
        </div>
        <h1 className="text-2xl font-bold">نتائج الفصل</h1>
      </div>

      <Card className="bg-accent text-accent-foreground mb-5">
        <div className="text-[11px] opacity-70">المعدل العام</div>
        <div className="flex items-end gap-2 mt-1">
          <div className="text-5xl font-mono font-bold">{ar(avg.toFixed(1))}</div>
          <div className="text-sm opacity-80 mb-2">٪</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15">
          <Stat label="الترتيب" value={`${ar(STUDENT_STATS.rank)}`} />
          <Stat label="الحضور" value={`${ar(STUDENT_STATS.attendance)}٪`} />
          <Stat label="إنجاز متتالٍ" value={ar(STUDENT_STATS.streak)} />
        </div>
      </Card>

      <SectionTitle eyebrow="حسب المادة" title="تفاصيل الدرجات" />
      <div className="space-y-2.5">
        {GRADES_RESULTS.map((g, i) => {
          const pct = (g.score / g.max) * 100;
          const trendIcon = g.trend.startsWith("+") ? TrendingUp : g.trend.startsWith("-") ? TrendingDown : Minus;
          const TrendIcon = trendIcon;
          const trendColor = g.trend.startsWith("+") ? "text-emerald-700" : g.trend.startsWith("-") ? "text-destructive" : "text-muted-foreground";
          return (
            <Card key={i} className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">{g.subject}</div>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${trendColor}`}>
                  <TrendIcon className="size-3" />
                  {g.trend}
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-mono font-bold text-2xl">{ar(g.score)}</span>
                <span className="text-xs text-muted-foreground">/ {ar(g.max)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="font-mono font-bold text-lg">{value}</div>
    </div>
  );
}
