import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { Calculator, Coins, NotebookPen, Timer, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الأدوات" },
      { name: "description", content: "أدوات سريعة: حاسبة، ملاحظات، عداد، وغيرها." },
    ],
  }),
  component: ToolsPage,
});

const TOOLS = [
  { id: "calc", label: "آلة حاسبة", icon: Calculator },
  { id: "fx", label: "تحويل عملات", icon: Coins },
  { id: "notes", label: "ملاحظات", icon: NotebookPen },
  { id: "timer", label: "عدّ تنازلي", icon: Timer },
  { id: "game", label: "لعبة سريعة", icon: Gamepad2 },
];

function ToolsPage() {
  const [active, setActive] = useState("calc");
  const [expr, setExpr] = useState("");
  const [note, setNote] = useState("");

  return (
    <AppShell title="الأدوات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          أدوات سريعة
        </div>
        <h1 className="text-2xl font-bold">صندوق الأدوات</h1>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition ${
                active === t.id
                  ? "bg-accent text-accent-foreground"
                  : "glass text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {active === "calc" && (
        <Card>
          <div className="font-mono text-3xl font-bold text-left mb-3 min-h-[2.5rem] truncate">
            {expr || "٠"}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === "=") {
                    try { setExpr(String(eval(expr))); } catch { setExpr("خطأ"); }
                  } else setExpr((e) => (e === "خطأ" ? "" : e) + k);
                }}
                className="aspect-square rounded-xl glass font-mono font-bold text-lg active:scale-95 transition"
              >
                {k}
              </button>
            ))}
          </div>
          <button
            onClick={() => setExpr("")}
            className="w-full mt-2 py-2.5 rounded-xl bg-accent/10 text-accent font-bold text-sm"
          >
            مسح
          </button>
        </Card>
      )}

      {active === "notes" && (
        <Card>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ملاحظتك هنا…"
            className="w-full min-h-[200px] bg-transparent text-sm focus:outline-none resize-none"
          />
          <div className="text-[11px] text-muted-foreground text-left mt-2">
            {note.length} حرف
          </div>
        </Card>
      )}

      {(active === "fx" || active === "timer" || active === "game") && (
        <Card className="text-center py-10">
          <div className="text-sm font-bold mb-2">قريباً</div>
          <p className="text-xs text-muted-foreground">
            هذه الأداة قيد التطوير وستكون متاحة قريباً.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
