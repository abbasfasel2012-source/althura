import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { BOOKS } from "@/lib/store";
import { Download } from "lucide-react";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المكتبة" },
      { name: "description", content: "مكتبة الكتب الإلكترونية لجميع المراحل." },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  return (
    <AppShell title="المكتبة">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          ١٢ كتاب متاح
        </div>
        <h1 className="text-2xl font-bold">مكتبة الذرى</h1>
        <p className="text-sm text-muted-foreground mt-1">كل ما تحتاجه من مناهج وملخصات.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {BOOKS.map((b, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-3 animate-reveal"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div
              className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${b.color} relative overflow-hidden mb-2 grid place-items-center text-center p-3`}
            >
              <div className="text-xs font-bold text-stone-800 leading-tight">{b.title}</div>
              <div className="absolute bottom-2 left-2 right-2 text-[9px] text-stone-700/80 font-mono">
                {b.pages} ص
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="text-[11px] font-bold truncate">{b.grade}</div>
              <Download className="size-3.5 text-primary" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
