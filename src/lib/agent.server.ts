import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const actionSchema = z.object({
  action: z.enum(["read_only", "send_message", "update_preferences", "mark_homework_done", "delete_conversation", "report_conversation"]),
  label: z.string().min(1).max(180),
  requiresConfirmation: z.boolean(),
  payload: z.record(z.string(), z.unknown()).default({}),
});
const planSchema = z.object({
  needsConfirmation: z.boolean(),
  summary: z.string().min(1).max(300),
  steps: z.array(actionSchema).max(8),
});

export async function planAgentRequest(request: string, context: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY غير مهيأ");
  const gateway = createLovableAiGatewayProvider(key);
  const result = await generateObject({
    model: gateway("google/gemini-3-flash-preview"),
    schema: planSchema,
    system: `أنت مخطط وكيل داخل تطبيق تعليمي. حوّل طلب المستخدم إلى خطة قصيرة من أدوات مسموحة فقط.
أدوات القراءة لا تحتاج تأكيدًا. أي إرسال أو تعديل أو حذف أو تغيير إعدادات يحتاج تأكيدًا إلزاميًا.
لا تخترع معرّفات أو مستلمين أو ملفات. لا تسمح بتغيير كلمات المرور أو مفاتيح الخدمات أو الملكية أو الفوترة أو صلاحيات المستخدمين أو إعدادات الأمان الحساسة.
إذا كان الطلب مجرد سؤال معرفي، أعد action=read_only وneedsConfirmation=false.
إذا طلب المستخدم إرسال صورة/ملف ولم توجد ملفات مرفقة، اذكر في label أن عليه اختيار الملفات أولًا ولا تنفذ شيئًا.
سياق المستخدم:
${context.slice(0, 12000)}`,
    prompt: request,
  });
  return result.object;
}

export async function createAgentRun(userId: string, request: string, plan: z.infer<typeof planSchema>, conversationId: string | null) {
  const db = supabaseAdmin as any;
  const { data, error } = await db.from("agent_runs").insert({ user_id: userId, conversation_id: conversationId, request, plan: plan.steps, status: plan.needsConfirmation ? "awaiting_confirmation" : "running" }).select("id").single();
  if (error) throw error;
  await db.from("agent_steps").insert(plan.steps.map((step, index) => ({ run_id: data.id, step_index: index, label: step.label, status: plan.needsConfirmation ? "pending" : "running" })));
  return data.id as string;
}

export async function executeAgentRun(userId: string, runId: string) {
  const db = supabaseAdmin as any;
  const { data: run, error } = await db.from("agent_runs").select("id,plan,status").eq("id", runId).eq("user_id", userId).single();
  if (error || !run) throw new Error("خطة الوكيل غير موجودة");
  if (run.status !== "awaiting_confirmation") throw new Error("لا يمكن تنفيذ هذه الخطة");
  await db.from("agent_runs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userId);
  const results: unknown[] = [];
  try {
    for (let i = 0; i < run.plan.length; i++) {
      const step = run.plan[i];
      await db.from("agent_steps").update({ status: "running" }).eq("run_id", runId).eq("step_index", i);
      let result: unknown;
      if (step.action === "update_preferences") {
        const preferences = step.payload?.preferences;
        if (!preferences || typeof preferences !== "object") throw new Error("تفضيلات غير صالحة");
        const { error: prefError } = await db.from("user_preferences").upsert({ user_id: userId, preferences, updated_at: new Date().toISOString() });
        if (prefError) throw prefError;
        result = { ok: true, message: "تم تحديث التفضيلات" };
      } else if (step.action === "mark_homework_done") {
        const homeworkId = String(step.payload?.homeworkId ?? "");
        if (!homeworkId) throw new Error("معرّف الواجب غير موجود");
        const { error: hwError } = await db.from("homework").update({ done: true }).eq("id", homeworkId).eq("user_id", userId);
        if (hwError) throw hwError;
        result = { ok: true, message: "تم تعليم الواجب كمنجز" };
      } else {
        result = { ok: false, message: "هذه الأداة تحتاج ربطًا إضافيًا بالبيانات أو الملفات" };
      }
      results.push(result);
      await db.from("agent_steps").update({ status: "completed", result }).eq("run_id", runId).eq("step_index", i);
    }
    await db.from("agent_runs").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userId);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تنفيذ الخطة";
    await db.from("agent_runs").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userId);
    throw new Error(message);
  }
}
