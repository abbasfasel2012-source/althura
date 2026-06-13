import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { ANNOUNCEMENTS } from "@/lib/store";
import { Pin } from "lucide-react";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | التبليغات" },
      { name: "description", content: "آخر تبليغات الإدارة والمعلمين." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <AppShell title="التبليغات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          آخر المستجدات
        </div>
        <h1 className="text-2xl font-bold">إعلانات الإدارة</h1>
      </div>

      <div className="space-y-3">
        {ANNOUNCEMENTS.map((a, i) => (
          <Card key={i} className={a.pinned ? "ring-1 ring-primary/30" : ""}>
            <div className="flex items-center gap-2 mb-2">
              {a.pinned && <Pin className="size-3 text-primary" />}
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                {a.tag}
              </span>
              <span className="text-[10px] text-muted-foreground mr-auto">{a.date}</span>
            </div>
            <h3 className="font-bold text-base mb-1">{a.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
