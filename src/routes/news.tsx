import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { fetchNews, deleteNews, formatDate } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Loader2, Trash2 } from "lucide-react";

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
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["news"], queryFn: fetchNews });

  async function onDelete(id: string) {
    if (!confirm("حذف هذا الخبر؟")) return;
    await deleteNews(id);
    qc.invalidateQueries({ queryKey: ["news"] });
  }

  return (
    <AppShell title="الأخبار">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          من المدرسة
        </div>
        <h1 className="text-2xl font-bold">آخر الأخبار</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <Card className="text-center py-10 text-sm text-muted-foreground">
          لا توجد أخبار بعد.
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((n) => (
          <Card key={n.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatDate(n.created_at)}
              </span>
              {isOwner && (
                <button
                  onClick={() => onDelete(n.id)}
                  className="mr-auto text-destructive opacity-60 hover:opacity-100"
                  aria-label="حذف"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <h3 className="font-bold mb-1.5">{n.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {n.body}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
