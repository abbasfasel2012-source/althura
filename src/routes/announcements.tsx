import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { fetchAnnouncements, deleteAnnouncement, formatDate } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { Loader2, Pin, Trash2 } from "lucide-react";
import { SkList } from "@/components/Skeletons";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | التبليغات" },
      { name: "description", content: "آخر تبليغات الإدارة والمعلمين." },
      { property: "og:title", content: "الذرى الذكية | التبليغات" },
      { property: "og:description", content: "آخر تبليغات الإدارة والمعلمين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  async function onDelete(id: string) {
    if (!confirm("حذف هذا التبليغ؟")) return;
    await deleteAnnouncement(id);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  return (
    <AppShell title="التبليغات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          آخر المستجدات
        </div>
        <h1 className="text-2xl font-bold">إعلانات الإدارة</h1>
      </div>

      {isLoading && (
        <SkList rows={4} />
      )}

      {error && (
        <Card className="text-center text-sm text-destructive space-y-1">
          <div>تعذّر تحميل التبليغات.</div>
          <div className="text-[10px] opacity-70 font-mono" dir="ltr">{getErrorMessage(error)}</div>
        </Card>
      )}

      {!isLoading && data && data.length === 0 && (
        <Card className="text-center py-10 text-sm text-muted-foreground">
          لا توجد تبليغات بعد.
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((a) => (
          <Card key={a.id} className={a.pinned ? "ring-1 ring-primary/30" : ""}>
            <div className="flex items-center gap-2 mb-2">
              {a.pinned && <Pin className="size-3 text-primary" />}
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                تبليغ
              </span>
              <span className="text-[10px] text-muted-foreground mr-auto">
                {formatDate(a.created_at)}
              </span>
              {isOwner && (
                <button
                  onClick={() => onDelete(a.id)}
                  className="text-destructive opacity-60 hover:opacity-100"
                  aria-label="حذف"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <h3 className="font-bold text-base mb-1">{a.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {a.body}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
