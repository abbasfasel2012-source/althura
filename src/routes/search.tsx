import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { ANNOUNCEMENTS, BOOKS, EXAMS, HOMEWORK, TEACHERS } from "@/lib/store";
import { Search } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | البحث" },
      { name: "description", content: "ابحث في الكتب، المدرّسين، الواجبات، والتبليغات." },
    ],
  }),
  component: SearchPage,
});

type Hit = { label: string; sub: string; to: string };

function SearchPage() {
  const [q, setQ] = useState("");

  const results = useMemo<Hit[]>(() => {
    const t = q.trim();
    if (!t) return [];
    const k = t.toLowerCase();
    const hits: Hit[] = [];
    BOOKS.forEach((b) => b.title.toLowerCase().includes(k) && hits.push({ label: b.title, sub: "كتاب", to: "/books" }));
    TEACHERS.forEach((te) => (te.name + te.subject).toLowerCase().includes(k) && hits.push({ label: te.name, sub: `مدرّس • ${te.subject}`, to: "/teachers" }));
    EXAMS.forEach((e) => e.title.toLowerCase().includes(k) && hits.push({ label: e.title, sub: `امتحان • ${e.date}`, to: "/exams" }));
    HOMEWORK.forEach((h) => h.title.toLowerCase().includes(k) && hits.push({ label: h.title, sub: `واجب • ${h.subject}`, to: "/homework" }));
    ANNOUNCEMENTS.forEach((a) => (a.title + a.body).toLowerCase().includes(k) && hits.push({ label: a.title, sub: "تبليغ", to: "/announcements" }));
    return hits;
  }, [q]);

  const quick = [
    { label: "الواجبات", to: "/homework" as const },
    { label: "الامتحانات", to: "/exams" as const },
    { label: "الكتب", to: "/books" as const },
    { label: "المدرّسون", to: "/teachers" as const },
    { label: "التقويم", to: "/calendar" as const },
    { label: "الدرجات", to: "/grades" as const },
  ];

  return (
    <AppShell title="البحث">
      <div className="glass-strong rounded-2xl p-1.5 flex items-center gap-2 mb-5 shadow-soft">
        <Search className="size-4 text-muted-foreground mr-2" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في كل شيء…"
          className="flex-1 bg-transparent text-sm py-2 focus:outline-none"
        />
      </div>

      {q.trim() === "" ? (
        <>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-2">
            وصول سريع
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quick.map((s) => (
              <Link key={s.to} to={s.to} className="glass rounded-2xl p-4 text-center font-bold text-sm">
                {s.label}
              </Link>
            ))}
          </div>
        </>
      ) : results.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => (
            <Link
              key={i}
              to={r.to}
              className="glass rounded-2xl p-3.5 flex items-center justify-between hover:bg-surface-2 transition"
            >
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
