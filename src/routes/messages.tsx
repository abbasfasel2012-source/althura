import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { fetchConversations, ar } from "@/lib/data";
import { Loader2, MessageCircle, Users } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تواصل" },
      { name: "description", content: "محادثاتك الخاصة مع الطلاب والمدرّسين." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const q = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations, refetchInterval: 5000 });

  return (
    <AppShell title="تواصل">
      <div className="mb-4 animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">محادثاتك</div>
        <h1 className="text-2xl font-bold">تواصل</h1>
        <p className="text-sm text-muted-foreground mt-1">رسائلك الخاصة مع أعضاء المدرسة.</p>
      </div>

      <Link to="/teachers" className="glass rounded-2xl p-4 flex items-center gap-3 mb-4 shadow-soft">
        <div className="size-10 rounded-xl bg-accent/10 text-accent grid place-items-center"><Users className="size-4" /></div>
        <div className="flex-1">
          <div className="font-bold text-sm">ابدأ محادثة جديدة</div>
          <div className="text-[11px] text-muted-foreground">تصفّح المدرّسين والزملاء</div>
        </div>
      </Link>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="text-center py-10 glass rounded-3xl">
          <MessageCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد محادثات بعد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((c) => (
            <Link key={c.other_id} to="/dm/$userId" params={{ userId: c.other_id }}
              className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center font-bold">
                {c.other_name?.[0] ?? "؟"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{c.other_name || "عضو"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{c.last_content}</div>
              </div>
              <div className="text-left shrink-0">
                <div className="text-[10px] text-muted-foreground">
                  {new Date(c.last_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {c.unread > 0 && (
                  <span className="inline-block mt-1 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5 font-mono">
                    {ar(c.unread)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
