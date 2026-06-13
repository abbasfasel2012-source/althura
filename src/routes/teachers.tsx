import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { TEACHERS, ar } from "@/lib/store";
import { Star } from "lucide-react";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المدرّسون" },
      { name: "description", content: "هيئة التدريس في ثانوية الذرى الذكية." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  return (
    <AppShell title="المدرّسون">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          الكادر التعليمي
        </div>
        <h1 className="text-2xl font-bold">هيئة التدريس</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEACHERS.map((t, i) => (
          <Card key={i} className="!p-4 text-center">
            <div className="size-14 mx-auto rounded-2xl bg-accent text-accent-foreground grid place-items-center text-xl font-bold mb-2 shadow-glass">
              {t.name.split(" ")[1]?.[0] ?? "أ"}
            </div>
            <div className="font-bold text-sm leading-tight">{t.name}</div>
            <div className="text-[11px] text-primary font-bold mt-1">{t.subject}</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-primary text-primary" />
              <span className="font-mono font-bold">{ar(t.rating)}</span>
              <span>•</span>
              <span>{ar(t.years)} سنة</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
