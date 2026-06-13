import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AppShell } from "@/components/AppShell";
import { Send, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | مساعد عبوسي" },
      { name: "description", content: "مساعد ذكي يساعدك في دروسك وواجباتك." },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || isLoading) return;
    setInput("");
    await sendMessage({ text: t });
    inputRef.current?.focus();
  };

  const renderText = (m: (typeof messages)[number]) =>
    m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null));

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
          <div className="font-bold">عبوسي • {isLoading ? "يكتب…" : "متصل"}</div>
        </div>
      </div>

      <div className="space-y-3 pb-32">
        {messages.length === 0 && (
          <div className="glass p-4 rounded-2xl text-sm leading-relaxed animate-reveal">
            أهلاً، أنا عبوسي. اسألني عن أي درس، وسأشرحه لك بكل بساطة.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap animate-reveal ${
              m.role === "assistant"
                ? "glass mr-0 ml-auto rounded-tr-md"
                : "bg-accent text-accent-foreground ml-0 mr-auto rounded-tl-md"
            }`}
          >
            {renderText(m)}
          </div>
        ))}
        {status === "submitted" && (
          <div className="glass max-w-[60%] p-3.5 rounded-2xl mr-0 ml-auto rounded-tr-md flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>يفكر…</span>
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-2xl text-sm">
            تعذّر الاتصال بعبوسي. حاول مرة أخرى.
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-24 left-4 right-4 z-40">
        <form
          onSubmit={onSubmit}
          className="glass-strong rounded-2xl p-1.5 flex items-center gap-1.5 shadow-glass"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك لعبوسي…"
            className="flex-1 px-3 py-2.5 bg-transparent text-sm focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="size-10 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0 disabled:opacity-50"
            aria-label="إرسال"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4 rotate-180" />
            )}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
