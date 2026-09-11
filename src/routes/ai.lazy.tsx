import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AppShell } from "@/components/AppShell";
import { getErrorMessage } from "@/lib/utils";
import { Send, Sparkles, Loader2, Menu, Plus, Trash2, Pencil, Share2, Flag, X, Search, Check, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";

type Conversation = { id: string; title: string; updated_at: string };

export const Route = createLazyFileRoute("/ai")({ component: AIPage });

function AIPage() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [sideOpen, setSideOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ recipientName: string; content: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  };
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", headers: authHeaders }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  async function loadHistory() {
    const response = await fetch("/api/ai/conversations", { headers: await authHeaders() });
    if (response.ok) setHistory(await response.json());
  }
  useEffect(() => { void loadHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  useEffect(() => {
    if (!messages.length || isLoading) return;
    const records = messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.parts.map((p) => p.type === "text" ? p.text : "").join("") })).filter((m) => m.content);
    void (async () => {
      const response = await fetch("/api/ai/conversations", { method: "POST", headers: { "content-type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ conversationId, messages: records }) });
      if (response.ok) { const data = await response.json(); setConversationId(data.conversationId); void loadHistory(); }
    })();
  }, [messages.length, isLoading]);

  const getText = (m: (typeof messages)[number]) => m.parts.map((p) => p.type === "text" ? p.text : "").join("");
  const isTouchDevice = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const onSubmit = async (e: React.FormEvent) => { e.preventDefault(); const t = input.trim(); if (!t || isLoading) return; const command = t.match(/^ارسل رسالة إلى\s+(.+?)\s*:\s*(.+)$/i); if (command) { setPendingAction({ recipientName: command[1], content: command[2] }); setInput(""); return; } setInput(""); await sendMessage({ text: t }); if (!isTouchDevice()) inputRef.current?.focus(); };
  const confirmAction = async () => { if (!pendingAction) return; const response = await fetch("/api/ai/actions", { method: "POST", headers: { "content-type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ action: "send_message", confirmed: true, ...pendingAction }) }); if (response.ok) { setPendingAction(null); window.alert("تم إرسال الرسالة"); } else window.alert("تعذّر تنفيذ الأمر"); };
  const newChat = () => { setMessages([]); setConversationId(null); setSideOpen(false); setReportSent(false); };
  const renameConversation = async (item: Conversation) => { const title = window.prompt("اسم المحادثة", item.title); if (!title?.trim()) return; await fetch("/api/ai/conversations", { method: "PATCH", headers: { "content-type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ conversationId: item.id, title }) }); void loadHistory(); };
  const deleteConversation = async (item: Conversation) => { if (!window.confirm("حذف هذه المحادثة؟")) return; await fetch(`/api/ai/conversations?id=${item.id}`, { method: "DELETE", headers: await authHeaders() }); if (conversationId === item.id) newChat(); void loadHistory(); };
  const shareConversation = async () => { await navigator.clipboard?.writeText(messages.map((m) => `${m.role === "user" ? "الطالب" : "عبوسي"}: ${getText(m)}`).join("\n\n")); window.alert("تم نسخ المحادثة للمشاركة"); };
  const submitReport = async () => { if (!reportTitle.trim() || !reportDescription.trim()) return; const response = await fetch("/api/ai/report", { method: "POST", headers: { "content-type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ conversationId, title: reportTitle, description: reportDescription, messages: messages.map((m) => ({ role: m.role, content: getText(m) })) }) }); if (response.ok) { setReportSent(true); setReporting(false); setReportTitle(""); setReportDescription(""); } };

  return <AppShell title="مساعد عبوسي">
    <div className="animate-reveal flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3"><div className="size-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-glass"><Sparkles className="size-5" /></div><div><div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase">ذكاء أكاديمي</div><div className="font-bold">عبوسي • {isLoading ? "يكتب…" : "متصل"}</div></div></div>
      <button onClick={() => setSideOpen(true)} className="size-10 rounded-xl glass grid place-items-center" aria-label="سجل المحادثات"><Menu className="size-5" /></button>
    </div>
    {reportSent && <div className="glass rounded-xl p-3 mb-3 text-sm text-primary">تم إرسال التبليغ إلى المالك الأعلى.</div>}
    {pendingAction && <div className="glass-strong rounded-2xl p-4 mb-4 border border-accent" dir="rtl"><div className="font-bold mb-2">طلب تنفيذ يحتاج تأكيدك</div><div className="text-sm">إرسال رسالة إلى <b>{pendingAction.recipientName}</b>:</div><div className="text-sm mt-1 p-2 rounded-lg bg-surface-2">{pendingAction.content}</div><div className="flex gap-2 mt-3"><button onClick={() => void confirmAction()} className="flex-1 rounded-xl bg-accent text-accent-foreground py-2 text-sm font-bold">تأكيد</button><button onClick={() => setPendingAction(null)} className="flex-1 rounded-xl glass py-2 text-sm">إلغاء</button></div></div>}
    <div className="space-y-3 pb-32">
      {!messages.length && <div className="glass p-4 rounded-2xl text-sm leading-relaxed">أهلاً، أنا عبوسي. اسألني عن دروسك أو واجباتك. وللبحث في الإنترنت اكتب: «ابحث في الويب عن…».</div>}
      {messages.map((m) => <div key={m.id} className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed animate-reveal ${m.role === "assistant" ? "glass mr-0 ml-auto rounded-tr-md" : "bg-accent text-accent-foreground ml-0 mr-auto rounded-tl-md"}`}>{m.role === "assistant" ? <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_strong]:font-bold [&_strong]:text-accent [&_a]:text-accent [&_a]:underline"><ReactMarkdown remarkPlugins={[remarkGfm]}>{getText(m)}</ReactMarkdown></div> : <span className="whitespace-pre-wrap">{getText(m)}</span>}</div>)}
      {status === "submitted" && <div className="glass max-w-[60%] p-3.5 rounded-2xl mr-0 ml-auto flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />يفكر…</div>}
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-2xl text-sm">تعذّر الاتصال بعبوسي. حاول مرة أخرى.<div className="text-[10px] opacity-70 mt-1 font-mono" dir="ltr">{getErrorMessage(error)}</div></div>}
      <div ref={endRef} />
    </div>
    <div className="fixed bottom-24 left-4 right-4 z-40 lg:bottom-8 lg:left-72 lg:right-0 lg:px-10"><div className="lg:max-w-2xl lg:mx-auto"><form onSubmit={onSubmit} className="glass-strong rounded-2xl p-1.5 flex items-center gap-1.5 shadow-glass"><input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب سؤالك لعبوسي…" className="flex-1 px-3 py-2.5 bg-transparent text-sm focus:outline-none" disabled={isLoading} /><button type="submit" disabled={isLoading || !input.trim()} className="size-10 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0 disabled:opacity-50"><Send className="size-4 rotate-180" /></button></form></div></div>

    {sideOpen && <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSideOpen(false)}><aside className="absolute right-0 top-0 bottom-0 w-[min(88vw,360px)] bg-background p-4 shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><button onClick={() => setSideOpen(false)} className="size-9 glass rounded-xl grid place-items-center"><X className="size-4" /></button><div className="font-bold">سجل المحادثات</div><button onClick={newChat} className="size-9 rounded-xl bg-accent text-accent-foreground grid place-items-center" title="محادثة جديدة"><Plus className="size-4" /></button></div><div className="space-y-2 overflow-y-auto max-h-[70vh]">{history.map((item) => <div key={item.id} onPointerDown={() => { longPressRef.current = setTimeout(() => { const action = window.prompt("اكتب: تعديل أو حذف أو مشاركة أو تبليغ"); if (action === "تعديل") void renameConversation(item); if (action === "حذف") void deleteConversation(item); if (action === "مشاركة") void shareConversation(); if (action === "تبليغ") setReporting(true); }, 650); }} onPointerUp={() => { if (longPressRef.current) clearTimeout(longPressRef.current); }} className="glass rounded-xl p-3 text-sm cursor-pointer"><div className="font-bold truncate">{item.title}</div><div className="text-[10px] text-muted-foreground mt-1">اضغط مطولًا للتعديل أو الحذف أو المشاركة أو التبليغ</div></div>)}{!history.length && <div className="text-sm text-muted-foreground text-center py-8">لا توجد محادثات محفوظة</div>}</div></aside></div>}
    {reporting && <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4"><div className="w-full max-w-md glass-strong rounded-2xl p-5" dir="rtl"><div className="flex justify-between items-center mb-4"><b>التبليغ عن المحادثة</b><button onClick={() => setReporting(false)}><X className="size-4" /></button></div><input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="عنوان المشكلة" className="w-full glass rounded-xl p-3 mb-3 text-sm" /><textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="اشرح المشكلة" className="w-full glass rounded-xl p-3 h-28 text-sm resize-none" /><button onClick={() => void submitReport()} className="w-full rounded-xl bg-accent text-accent-foreground py-3 mt-3 font-bold">إرسال التبليغ</button></div></div>}
  </AppShell>;
}
