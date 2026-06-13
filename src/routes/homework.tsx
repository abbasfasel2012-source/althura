import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { HOMEWORK } from "@/lib/store";
import { Check, FileText } from "lucide-react";

export const Route = createFileRoute("/homework")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الواجبات" },
      { name: "description", content: "تابع واجباتك اليومية ومواعيد تسليمها." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const [items, setItems] = useState(HOMEWORK);
  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <AppShell title="الواجبات">
      <div className="animate-reveal grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <div className="text-[11px] text-muted-foreground">مفتوحة</div>
          <div className="text-3xl font-mono font-bold mt-1 text-accent">
            {String(open.length).padStart(2, "٠")}
          </div>
        </Card>
        <Card className="!p-4 bg-accent text-accent-foreground">
          <div className="text-[11px] opacity-70">منجزة</div>
          <div className="text-3xl font-mono font-bold mt-1">
            {String(done.length).padStart(2, "٠")}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle eyebrow="قائمة المهام" title="مفتوحة الآن" />
        <div className="space-y-3">
          {open.map((h, i) => (
            <button
              key={i}
              onClick={() => setItems(items.map((x) => (x === h ? { ...x, done: true } : x)))}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-right hover:bg-surface-2 transition"
            >
              <div className="size-9 rounded-xl border-2 border-border grid place-items-center shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{h.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {h.subject} • تسليم {h.due}
                </div>
              </div>
              <FileText className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <SectionTitle eyebrow="تمت" title="مكتملة" />
          <div className="space-y-3">
            {done.map((h, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3 opacity-60">
                <div className="size-9 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0">
                  <Check className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm line-through truncate">{h.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{h.subject}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
