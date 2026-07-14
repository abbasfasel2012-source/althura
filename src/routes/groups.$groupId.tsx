import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, sendMessage, fetchGroups, joinGroup, ar } from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupChatPage,
});

function GroupChatPage() {
  const { groupId } = Route.useParams();
  const { userId } = useAuth();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const group = groups?.find((g) => g.id === groupId);

  // Auto-join on entering (so RLS lets us read messages of private groups too)
  useEffect(() => {
    if (userId && groupId) {
      joinGroup(groupId).catch(() => {});
    }
  }, [userId, groupId]);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["messages", groupId],
    queryFn: () => fetchMessages(groupId),
    refetchInterval: 3000,
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (text: string) => sendMessage(groupId, text),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || mutation.isPending) return;
    mutation.mutate(content);
  };

  return (
    <AppShell title={group?.name || "المحادثة"}>
      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pb-4 px-1 scrollbar-hide"
        >
          {!userId ? (
            <div className="text-center py-10 text-sm text-muted-foreground">يجب تسجيل الدخول لعرض المحادثة</div>
          ) : isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm text-center">تعذّر تحميل الرسائل</div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">ابدأ المحادثة الآن...</div>
          ) : (
            messages?.map((m) => {
              const isMe = m.user_id === userId;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {!isMe && <span className="text-[10px] font-bold text-primary">{m.profiles?.full_name}</span>}
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe ? "bg-accent text-accent-foreground rounded-tr-none" : "glass rounded-tl-none"
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="mt-2 relative">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="w-full pl-14 pr-5 py-4 rounded-2xl glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="submit"
            disabled={!content.trim() || mutation.isPending}
            className="absolute left-2 top-2 size-10 rounded-xl bg-primary text-white grid place-items-center disabled:opacity-50 transition-transform active:scale-90"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
