import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { Calculator, Coins, NotebookPen, Timer, Gamepad2, Pause, Play, RotateCcw } from "lucide-react";
import { ar, useLocalStorage } from "@/lib/store";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الأدوات" },
      { name: "description", content: "أدوات سريعة: حاسبة، ملاحظات، عداد، تحويل عملات، ولعبة سريعة." },
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

const RATES: Record<string, number> = {
  USD: 1, IQD: 1310, EUR: 0.92, SAR: 3.75, AED: 3.67,
};

function ToolsPage() {
  const [active, setActive] = useState("calc");

  return (
    <AppShell title="الأدوات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          أدوات سريعة
        </div>
        <h1 className="text-2xl font-bold">صندوق الأدوات</h1>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition ${
                active === t.id ? "bg-accent text-accent-foreground" : "glass text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span className="text-[9px] font-bold leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {active === "calc" && <Calc />}
      {active === "notes" && <Notes />}
      {active === "timer" && <Pomodoro />}
      {active === "fx" && <FX />}
      {active === "game" && <Game />}
    </AppShell>
  );
}

function Calc() {
  const [expr, setExpr] = useState("");
  return (
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
  );
}

function Notes() {
  const [note, setNote] = useLocalStorage<string>("aladhra.note", "");
  return (
    <Card>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="اكتب ملاحظتك هنا…"
        className="w-full min-h-[200px] bg-transparent text-sm focus:outline-none resize-none"
      />
      <div className="text-[11px] text-muted-foreground text-left mt-2">
        {ar(note.length)} حرف • محفوظة تلقائياً
      </div>
    </Card>
  );
}

function Pomodoro() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const pct = ((25 * 60 - seconds) / (25 * 60)) * 100;

  return (
    <Card className="text-center">
      <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-2">
        تركيز
      </div>
      <div className="font-mono text-6xl font-bold tracking-tight">
        {ar(mm)}:{ar(ss)}
      </div>
      <div className="h-1.5 rounded-full bg-border my-5 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="size-14 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-glass"
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button
          onClick={() => { setRunning(false); setSeconds(25 * 60); }}
          className="size-14 rounded-2xl glass grid place-items-center"
        >
          <RotateCcw className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5">
        {[15, 25, 45].map((m) => (
          <button
            key={m}
            onClick={() => { setRunning(false); setSeconds(m * 60); }}
            className="py-2 rounded-xl glass text-xs font-bold"
          >
            {ar(m)} د
          </button>
        ))}
      </div>
    </Card>
  );
}

function FX() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("IQD");
  const num = parseFloat(amount) || 0;
  const result = (num / RATES[from]) * RATES[to];

  return (
    <Card>
      <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-3">
        محوّل العملات
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-transparent font-mono text-3xl font-bold focus:outline-none mb-3 text-left"
      />
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={from} onChange={setFrom} label="من" />
        <Select value={to} onChange={setTo} label="إلى" />
      </div>
      <div className="rounded-2xl bg-accent text-accent-foreground p-4 text-center">
        <div className="text-[10px] opacity-70 mb-1">النتيجة</div>
        <div className="font-mono font-bold text-2xl">
          {ar(result.toLocaleString("en-US", { maximumFractionDigits: 2 }))} {to}
        </div>
      </div>
    </Card>
  );
}

function Select({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="block">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none"
      >
        {Object.keys(RATES).map((c) => <option key={c}>{c}</option>)}
      </select>
    </label>
  );
}

function Game() {
  const [a] = useState(() => Math.floor(Math.random() * 20) + 1);
  const [b] = useState(() => Math.floor(Math.random() * 20) + 1);
  const [op] = useState<"+" | "-" | "×">(() => (["+", "-", "×"] as const)[Math.floor(Math.random() * 3)]);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;

  const check = () => {
    const n = parseFloat(guess);
    if (Number.isNaN(n)) return;
    if (n === answer) {
      setScore((s) => s + 1);
      setFeedback("إجابة صحيحة! ✨");
      setTimeout(() => window.location.reload(), 900);
    } else {
      setFeedback(`الإجابة الصحيحة: ${ar(answer)}`);
    }
  };

  return (
    <Card className="text-center">
      <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-2">
        تحدّي الحساب — النقاط {ar(score)}
      </div>
      <div className="font-mono text-5xl font-bold my-5">
        {ar(a)} {op} {ar(b)} = ؟
      </div>
      <input
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
        className="w-full text-center bg-transparent font-mono text-3xl font-bold border-b-2 border-accent/20 focus:outline-none focus:border-accent py-2 mb-4"
      />
      <button
        onClick={check}
        className="w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold text-sm"
      >
        تحقق
      </button>
      {feedback && <div className="mt-3 text-sm font-bold text-primary">{feedback}</div>}
    </Card>
  );
}
