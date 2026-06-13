import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { EVENTS } from "@/lib/store";
import { MapPin } from "lucide-react";

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
  return (
    <AppShell title="الفعاليات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          القادمة
        </div>
        <h1 className="text-2xl font-bold">فعاليات الذرى</h1>
      </div>
      <div className="space-y-3">
        {EVENTS.map((e, i) => (
          <Card key={i} className="bg-accent text-accent-foreground">
            <div className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-70 mb-2">
              {e.when}
            </div>
            <h3 className="font-bold text-lg mb-2">{e.title}</h3>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <MapPin className="size-3.5" /> {e.place}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
