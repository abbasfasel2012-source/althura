import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDirectMessages, sendDirectMessage, fetchProfileById } from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dm/$userId")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | محادثة خاصة" },
      { name: "description", content: "محادثة خاصة بين طالب ومدرّس." },
    ],
  }),
  component: DMPage,
});

function DMPage() {
  const { userId: otherId } = Route.useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile", otherId],
    queryFn: () => fetchProfileById(otherId),
  });

  const messagesQ = useQuery({
    queryKey: ["dm", otherId],
    queryFn: () => fetchDirectMessages(otherId),
    refetchInterval: 3000,
    enabled: !!userId,
  });

  const send = useMutation({
    mutationFn: (t: string) => sendDirectMessage(otherId, t),
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["dm", otherId] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesQ.data]);

  const name = profileQ.data?.full_name ?? "محادثة";
  const label = profileQ.data?.teaching_subject || profileQ.data?.admin_label || (profileQ.data?.is_teacher ? "مدرّس" : "طالب");

  return (
    <AppShell title={name}>
      <div className="flex items-center gap-3 mb-3 glass rounded-2xl p-3">
        <Link to="/teachers" className="size-9 grid place-items-center rounded-xl bg-surface-2">
          <ArrowRight className="size-4" />
        </Link>
        <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center font-bold">
          {name[0] ?? "؟"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{label}</div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-260px)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4 px-1 scrollbar-hide">
          {messagesQ.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (messagesQ.data ?? []).length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">لا رسائل بعد — ابدأ المحادثة.</div>
          ) : (
            messagesQ.data!.map((m) => {
              const isMe = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe ? "bg-accent text-accent-foreground rounded-tr-none" : "glass rounded-tl-none"
                  }`}>
                    <div>{m.content}</div>
                    <div className="text-[9px] opacity-60 mt-1 text-left" dir="ltr">
                      {new Date(m.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (content.trim() && !send.isPending) send.mutate(content); }}
          className="mt-2 relative"
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="w-full pl-14 pr-5 py-4 rounded-2xl glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!content.trim() || send.isPending}
            className="absolute left-2 top-2 size-10 rounded-xl bg-primary text-white grid place-items-center disabled:opacity-50"
          >
            {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
