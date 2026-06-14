import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { fetchEvents, deleteEvent } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Loader2, MapPin, Trash2 } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الفعاليات" },
      { name: "description", content: "فعاليات المدرسة القادمة." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  async function onDelete(id: string) {
    if (!confirm("حذف هذه الفعالية؟")) return;
    await deleteEvent(id);
    qc.invalidateQueries({ queryKey: ["events"] });
  }

  return (
    <AppShell title="الفعاليات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          القادمة
        </div>
        <h1 className="text-2xl font-bold">فعاليات الذرى</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <Card className="text-center py-10 text-sm text-muted-foreground">
          لا توجد فعاليات بعد.
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((e) => (
          <Card key={e.id} className="bg-accent text-accent-foreground relative">
            {isOwner && (
              <button
                onClick={() => onDelete(e.id)}
                className="absolute top-3 left-3 opacity-70 hover:opacity-100"
                aria-label="حذف"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            <div className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-70 mb-2">
              {e.starts_at ? new Date(e.starts_at).toLocaleDateString("ar-IQ", {
                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
              }) : "قريباً"}
            </div>
            <h3 className="font-bold text-lg mb-2">{e.title}</h3>
            {e.description && (
              <p className="text-xs opacity-80 mb-2 whitespace-pre-wrap">{e.description}</p>
            )}
            {e.location && (
              <div className="flex items-center gap-1.5 text-xs opacity-80">
                <MapPin className="size-3.5" /> {e.location}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
