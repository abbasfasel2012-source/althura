import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/AppShell";

async function fetchReports() {
  const { data, error } = await supabase.from("ai_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function AiReports() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ai-reports"], queryFn: fetchReports });
  async function updateStatus(id: string, status: string) {
    await supabase.from("ai_reports").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["ai-reports"] });
  }
  async function block(userId: string) {
    const days = Number(window.prompt("مدة الحظر بالأيام", "7"));
    if (!Number.isFinite(days) || days <= 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_blocks").insert({ user_id: userId, blocked_by: user.id, reason: "تبليغ عن محادثة غير مناسبة", blocked_until: new Date(Date.now() + days * 86400000).toISOString() });
    window.alert("تم تطبيق الحظر المؤقت");
  }
  return <div className="space-y-3"><div className="text-sm text-muted-foreground">هذا القسم ظاهر للمالك الأعلى فقط.</div>{q.data?.map((report: any) => <Card key={report.id}><div className="flex justify-between gap-3"><div><div className="font-bold">{report.title}</div><div className="text-xs text-muted-foreground mt-1">{new Date(report.created_at).toLocaleString("ar-IQ")}</div></div><span className="text-xs text-primary">{report.status}</span></div><p className="text-sm mt-3 whitespace-pre-wrap">{report.description}</p><details className="mt-3"><summary className="cursor-pointer text-xs font-bold">عرض المحادثة المبلّغ عنها</summary><pre className="text-xs whitespace-pre-wrap mt-2 max-h-64 overflow-auto">{JSON.stringify(report.conversation_snapshot, null, 2)}</pre></details><div className="flex gap-2 mt-4 flex-wrap"><button className="glass rounded-lg px-3 py-2 text-xs" onClick={() => void updateStatus(report.id, "reviewing")}>قيد المراجعة</button><button className="glass rounded-lg px-3 py-2 text-xs" onClick={() => void updateStatus(report.id, "resolved")}>حل التبليغ</button><button className="rounded-lg px-3 py-2 text-xs bg-destructive text-white" onClick={() => void block(report.user_id)}>حظر الطالب مؤقتًا</button></div></Card>)}{!q.isLoading && !q.data?.length && <Card className="text-center text-sm text-muted-foreground">لا توجد تبليغات.</Card>}</div>;
}
