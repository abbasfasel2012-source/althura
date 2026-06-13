import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { GROUPS } from "@/lib/store";
import { Users } from "lucide-react";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الكروبات" },
      { name: "description", content: "تواصل مع زملائك ومعلميك عبر الكروبات." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  return (
    <AppShell title="الكروبات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          محادثات نشطة
        </div>
        <h1 className="text-2xl font-bold">الكروبات</h1>
      </div>
      <div className="space-y-3">
        {GROUPS.map((g, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-accent/10 text-accent grid place-items-center shrink-0">
                <Users className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{g.name}</div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {g.last}
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className="font-mono text-xs font-bold text-primary">{g.members}</div>
                <div className="text-[9px] text-muted-foreground">عضو</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
