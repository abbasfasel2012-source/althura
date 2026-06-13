import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { NEWS } from "@/lib/store";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الأخبار" },
      { name: "description", content: "آخر أخبار وفعاليات ثانوية الذرى الذكية." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <AppShell title="الأخبار">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          من المدرسة
        </div>
        <h1 className="text-2xl font-bold">آخر الأخبار</h1>
      </div>
      <div className="space-y-3">
        {NEWS.map((n, i) => (
          <Card key={i}>
            <div className="text-[10px] text-muted-foreground mb-2 font-mono">{n.date}</div>
            <h3 className="font-bold mb-1.5">{n.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{n.excerpt}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
