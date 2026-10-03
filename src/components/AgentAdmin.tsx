import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export function AgentAdmin() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const qc = useQueryClient();
  const prompts = useQuery({ queryKey: ["agent-prompts"], queryFn: async () => (await supabase.from("agent_prompts").select("*").order("created_at", { ascending: false })).data ?? [] });
  const conversations = useQuery({ queryKey: ["agent-all-conversations"], queryFn: async () => (await supabase.from("ai_conversations").select("*").order("updated_at", { ascending: false }).limit(300)).data ?? [] });
  const profiles = useQuery({ queryKey: ["agent-audit-profiles"], queryFn: async () => (await supabase.from("profiles").select("id,full_name,student_id")).data ?? [] });
  const profileById = new Map((profiles.data ?? []).map((profile: any) => [profile.id, profile]));

  const addPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || isAdding) return;

    setIsAdding(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("تعذّر التحقق من حساب المالك");
      const { error } = await supabase.from("agent_prompts").insert({ prompt: nextPrompt, created_by: user.id });
      if (error) throw error;
      setPrompt("");
      await qc.invalidateQueries({ queryKey: ["agent-prompts"] });
      toast.success("تمت إضافة تعليمات الوكيل");
    } catch (error) {
      toast.error("تعذّر إرسال التعليمات", { description: error instanceof Error ? error.message : "حاول مرة ثانية" });
    } finally {
      setIsAdding(false);
    }
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase.from("agent_prompts").update({ is_active: false }).eq("id", id);
    if (error) {
      toast.error("تعذّر تعطيل التعليمات", { description: error.message });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["agent-prompts"] });
  };

  const loadMessages = async (conversation: any) => {
    const { data, error } = await supabase.from("ai_conversation_messages").select("role,content,created_at").eq("conversation_id", conversation.id).order("created_at");
    if (error) {
      toast.error("تعذّر تحميل المحادثة", { description: error.message });
      return;
    }
    setSelected({ ...conversation, messages: data ?? [] });
  };

  const hardDelete = async (id: string) => {
    if (!window.confirm("حذف نهائي؟ لا يمكن التراجع.")) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast.error("انتهت جلسة الدخول");
      return;
    }
    const response = await fetch(`/api/ai/admin?conversationId=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      toast.error("تعذّر حذف المحادثة");
      return;
    }
    setSelected(null);
    await qc.invalidateQueries({ queryKey: ["agent-all-conversations"] });
  };

  return (
    <div className="min-w-0 space-y-5" dir="rtl">
      <Card>
        <div className="mb-2 font-bold">تعليمات الوكيل</div>
        <div className="mb-3 text-xs text-muted-foreground">تُطبّق التعليمات النشطة على خطط عبوسي الجديدة، مثل منعه من حل الواجبات.</div>
        <form onSubmit={(event) => void addPrompt(event)} className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-border bg-surface-2 focus-within:ring-2 focus-within:ring-ring">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="h-12 min-w-0 border-0 bg-transparent px-3 text-sm outline-none"
            placeholder="اكتب تعليمات جديدة للوكيل"
            aria-label="تعليمات جديدة للوكيل"
          />
          <Button type="submit" disabled={!prompt.trim() || isAdding} className="h-12 shrink-0 rounded-none border-0 px-3 sm:px-5">
            {isAdding ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            <span>إرسال</span>
          </Button>
        </form>
        <div className="mt-4 space-y-2">{prompts.data?.map((item: any) => <div key={item.id} className={`glass grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl p-3 text-sm ${!item.is_active ? "opacity-50" : ""}`}><span className="min-w-0 break-words">{item.prompt}</span>{item.is_active && <Button variant="ghost" size="sm" onClick={() => void deletePrompt(item.id)} className="shrink-0 text-destructive">تعطيل</Button>}</div>)}</div>
      </Card>
      <Card>
        <div className="mb-3 font-bold">سجل محادثات الطلاب</div>
        <div className="mb-3 text-xs text-muted-foreground">يمكنك القراءة والتدقيق فقط. لا يمكن للمالك المراسلة من حساب الطالب أو تعديل اسم المحادثة.</div>
        <div className="max-h-[500px] space-y-2 overflow-auto">{conversations.data?.map((conversation: any) => { const profile = profileById.get(conversation.user_id) as any; return <Button variant="outline" key={conversation.id} onClick={() => void loadMessages(conversation)} className="h-auto w-full min-w-0 justify-start whitespace-normal rounded-xl p-3 text-right"><div className="min-w-0"><div className="truncate text-sm font-bold">{conversation.title}</div><div className="text-[10px] text-muted-foreground">الطالب: {profile?.full_name ?? conversation.user_id}{profile?.student_id ? ` (${profile.student_id})` : ""} {conversation.user_deleted_at ? "• محذوفة من الطالب" : ""}</div></div></Button>; })}</div>
      </Card>
      {selected && <Card><div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><b className="truncate">{selected.title}</b><Button variant="ghost" size="sm" onClick={() => void hardDelete(selected.id)} className="shrink-0 text-destructive">حذف نهائي</Button></div><div className="max-h-[450px] space-y-2 overflow-auto">{selected.messages.map((message: any, index: number) => <div key={index} className="glass rounded-xl p-3 text-sm"><b>{message.role === "user" ? "الطالب" : "عبوسي"}</b><div className="mt-1 whitespace-pre-wrap break-words">{message.content}</div></div>)}</div></Card>}
    </div>
  );
}