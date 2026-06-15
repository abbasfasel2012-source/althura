import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { Check, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ar } from "@/lib/data";

export const Route = createFileRoute("/homework")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الواجبات" },
      { name: "description", content: "تابع واجباتك اليومية ومواعيد تسليمها." },
    ],
  }),
  component: HomeworkPage,
});

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string | null;
  done: boolean;
  user_id: string;
  created_at: string;
}

async function fetchHomework(userId: string): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Homework[];
}

async function toggleHomework(id: string, done: boolean) {
  const { error } = await supabase.from("homework").update({ done }).eq("id", id);
  if (error) throw error;
}

function HomeworkPage() {
  const { userId, loading } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["homework", userId],
    queryFn: () => fetchHomework(userId!),
    enabled: !!userId,
  });

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => toggleHomework(id, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework", userId] }),
  });

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  if (loading || isLoading) {
    return (
      <AppShell title="الواجبات">
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  if (!userId) {
    return (
      <AppShell title="الواجبات">
        <Card className="text-center py-10 text-sm text-muted-foreground">سجّل دخولك لعرض الواجبات.</Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="الواجبات">
      <div className="animate-reveal grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <div className="text-[11px] text-muted-foreground">مفتوحة</div>
          <div className="text-3xl font-mono font-bold mt-1 text-accent">
            {ar(String(open.length).padStart(2, "0"))}
          </div>
        </Card>
        <Card className="!p-4 bg-accent text-accent-foreground">
          <div className="text-[11px] opacity-70">منجزة</div>
          <div className="text-3xl font-mono font-bold mt-1">
            {ar(String(done.length).padStart(2, "0"))}
          </div>
        </Card>
      </div>

      {items.length === 0 && (
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">
          لا توجد واجبات حالياً — سيضيفها الأدمن هنا.
        </Card>
      )}

      {open.length > 0 && (
        <div className="mt-6">
          <SectionTitle eyebrow="قائمة المهام" title="مفتوحة الآن" />
          <div className="space-y-3">
            {open.map((h) => (
              <button
                key={h.id}
                onClick={() => toggle.mutate({ id: h.id, done: true })}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-right hover:bg-surface-2 transition"
              >
                <div className="size-9 rounded-xl border-2 border-border grid place-items-center shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{h.title}</div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <FileText className="size-3" /> {h.subject}
                    {h.due_date && <span>• {new Date(h.due_date).toLocaleDateString("ar-IQ", { month: "short", day: "numeric" })}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-6">
          <SectionTitle eyebrow="مكتملة" title="تم إنجازها" />
          <div className="space-y-3">
            {done.map((h) => (
              <button
                key={h.id}
                onClick={() => toggle.mutate({ id: h.id, done: false })}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-right opacity-50 hover:opacity-70 transition"
              >
                <div className="size-9 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0">
                  <Check className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate line-through">{h.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{h.subject}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
