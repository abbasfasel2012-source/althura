import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ar, fetchMyGrades } from "@/lib/data";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/grades")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الدرجات" },
      { name: "description", content: "درجاتك الفعلية من السجل الأكاديمي." },
    ],
  }),
  component: GradesPage,
});

function GradesPage() {
  const { userId, isOwner, loading } = useAuth();
  const grades = useQuery({
    queryKey: ["my-grades", userId],
    queryFn: () => fetchMyGrades(userId!),
    enabled: !!userId,
  });

  if (loading) {
    return <AppShell title="الدرجات"><Card className="py-10 text-center text-xs text-muted-foreground">جاري التحميل…</Card></AppShell>;
  }

  if (!userId) {
    return (
      <AppShell title="الدرجات">
        <Card className="text-center py-10">
          <p className="text-sm text-muted-foreground mb-4">سجّل دخولك لعرض درجاتك.</p>
          <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm">
            تسجيل الدخول
          </Link>
        </Card>
      </AppShell>
    );
  }

  const list = grades.data ?? [];
  const avg = list.length ? list.reduce((s, g) => s + Number(g.score), 0) / list.length : 0;

  return (
    <AppShell title="الدرجات">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          سجلك الأكاديمي
        </div>
        <h1 className="text-2xl font-bold">نتائجك الفعلية</h1>
      </div>

      <Card className="bg-accent text-accent-foreground mb-5">
        <div className="text-[11px] opacity-70">المعدل العام</div>
        <div className="flex items-end gap-2 mt-1">
          <div className="text-5xl font-mono font-bold">{list.length ? ar(avg.toFixed(1)) : "—"}</div>
          {list.length > 0 && <div className="text-sm opacity-80 mb-2">٪</div>}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
          <Stat label="عدد المواد" value={ar(list.length)} />
          <Stat label="أعلى درجة" value={list.length ? ar(Math.max(...list.map(g => Number(g.score)))) : "—"} />
        </div>
      </Card>

      <SectionTitle eyebrow="حسب المادة" title="تفاصيل الدرجات" />
      <div className="space-y-2.5">
        {list.length === 0 && (
          <Card className="text-center text-xs text-muted-foreground py-8">
            {isOwner
              ? "أنت مسجّل كمالك — أضف الدرجات للطلاب من لوحة التحكم."
              : "لم تُسجَّل أي درجات بعد. ستظهر هنا فور إضافتها."}
          </Card>
        )}
        {list.map((g) => (
          <Card key={g.id} className="!p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm">{g.subject}</div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                <TrendingUp className="size-3" />
                {g.term}
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-mono font-bold text-2xl">{ar(g.score)}</span>
              <span className="text-xs text-muted-foreground">/ {ar(100)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Number(g.score))}%` }} />
            </div>
          </Card>
        ))}
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
