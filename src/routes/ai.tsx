import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | مساعد عبوسي" },
      { name: "description", content: "مساعد ذكي يساعدك في دروسك وواجباتك." },
    ],
  }),
  component: AIPage,
});

interface Msg {
  role: "user" | "ai";
  text: string;
}

function AIPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "أهلاً، أنا عبوسي. اسألني عن أي درس، وسأشرحه لك بكل بساطة." },
  ]);
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [
      ...m,
      { role: "user", text: t },
      {
        role: "ai",
        text: "هذا عرض تجريبي — قريباً سأجيبك مباشرة من نماذج الذكاء الاصطناعي.",
      },
    ]);
    setText("");
  };

  return (
    <AppShell title="مساعد عبوسي">
      <div className="animate-reveal flex items-center gap-3 mb-4">
        <div className="size-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-glass">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase">
            ذكاء أكاديمي
          </div>
          <div className="font-bold">عبوسي • متصل</div>
        </div>
      </div>

      <div className="space-y-3 pb-32">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed animate-reveal ${
              m.role === "ai"
                ? "glass mr-0 ml-auto rounded-tr-md"
                : "bg-accent text-accent-foreground ml-0 mr-auto rounded-tl-md"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="fixed bottom-24 left-4 right-4 z-40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="glass-strong rounded-2xl p-1.5 flex items-center gap-1.5 shadow-glass"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب سؤالك لعبوسي…"
            className="flex-1 px-3 py-2.5 bg-transparent text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="size-10 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0"
            aria-label="إرسال"
          >
            <Send className="size-4 rotate-180" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
