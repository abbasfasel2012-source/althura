import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const actionSchema = z.object({
  action: z.enum(["read_only", "send_message", "update_preferences", "update_theme", "create_homework", "mark_homework_done", "create_reminder", "delete_conversation", "report_conversation"]),
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
  const { data: promptRows } = await (supabaseAdmin as any).from("agent_prompts").select("prompt").eq("is_active", true).order("created_at", { ascending: false }).limit(10);
  const ownerRules = (promptRows ?? []).map((row: { prompt: string }) => `- ${row.prompt}`).join("\n");
  const result = await generateObject({
    model: gateway("google/gemini-3-flash-preview"),
    schema: planSchema,
    system: `أنت مخطط وكيل داخل تطبيق تعليمي. حوّل طلب المستخدم إلى خطة قصيرة من أدوات مسموحة فقط.
أدوات القراءة لا تحتاج تأكيدًا. أي إرسال أو تعديل أو حذف أو تغيير إعدادات يحتاج تأكيدًا إلزاميًا.
لا تخترع معرّفات أو مستلمين أو ملفات. لا تسمح بتغيير كلمات المرور أو مفاتيح الخدمات أو الملكية أو الفوترة أو صلاحيات المستخدمين أو إعدادات الأمان الحساسة.
إذا كان الطلب مجرد سؤال معرفي، أعد action=read_only وneedsConfirmation=false.
إذا طلب المستخدم إرسال صورة/ملف ولم توجد ملفات مرفقة، اذكر في label أن عليه اختيار الملفات أولًا ولا تنفذ شيئًا.
سياق المستخدم:
${context.slice(0, 12000)}
تعليمات المالك الأعلى الإضافية:
${ownerRules || "لا توجد تعليمات إضافية."}`,
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
  const { data: run, error } = await db.from("agent_runs").select("id,plan,status,conversation_id").eq("id", runId).eq("user_id", userId).single();
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
      } else if (step.action === "update_theme") {
        const theme = String(step.payload?.theme ?? "");
        if (!["light", "dark", "system"].includes(theme)) throw new Error("الثيم غير صالح");
        const { data: existing } = await db.from("user_preferences").select("preferences").eq("user_id", userId).maybeSingle();
        const { error: themeError } = await db.from("user_preferences").upsert({ user_id: userId, preferences: { ...(existing?.preferences ?? {}), theme }, updated_at: new Date().toISOString() });
        if (themeError) throw themeError;
        result = { ok: true, message: `تم تغيير المظهر إلى ${theme}` };
      } else if (step.action === "create_homework") {
        const title = String(step.payload?.title ?? "").trim();
        const subject = String(step.payload?.subject ?? "").trim();
        if (!title || !subject) throw new Error("عنوان الواجب والمادة مطلوبان");
        const { data: homework, error: homeworkError } = await db.from("homework").insert({ user_id: userId, title, subject, due_date: step.payload?.dueDate ?? null }).select("id,title,subject,due_date").single();
        if (homeworkError) throw homeworkError;
        result = { ok: true, message: "تم إنشاء الواجب", homework };
      } else if (step.action === "mark_homework_done") {
        const homeworkId = String(step.payload?.homeworkId ?? "");
        if (!homeworkId) throw new Error("معرّف الواجب غير موجود");
        const { error: hwError } = await db.from("homework").update({ done: true }).eq("id", homeworkId).eq("user_id", userId);
        if (hwError) throw hwError;
        result = { ok: true, message: "تم تعليم الواجب كمنجز" };
      } else if (step.action === "create_reminder") {
        const title = String(step.payload?.title ?? "").trim();
        const remindAt = String(step.payload?.remindAt ?? "").trim();
        if (!title || !remindAt || Number.isNaN(Date.parse(remindAt))) throw new Error("عنوان التذكير وموعده مطلوبان");
        const { data: reminder, error: reminderError } = await db.from("agent_reminders").insert({ user_id: userId, title, remind_at: new Date(remindAt).toISOString(), note: step.payload?.note ?? null }).select("id,title,remind_at").single();
        if (reminderError) throw reminderError;
        result = { ok: true, message: "تم إنشاء التذكير", reminder };
      } else if (step.action === "send_message") {
        const recipientName = String(step.payload?.recipientName ?? "").trim();
        const content = String(step.payload?.content ?? "").trim();
        if (!recipientName || !content) throw new Error("المستلم أو نص الرسالة غير موجود");
        const { data: recipients } = await db.from("profiles").select("id,full_name").ilike("full_name", `%${recipientName}%`).limit(5);
        const recipient = recipients?.[0];
        if (!recipient || recipient.id === userId) throw new Error("لم أجد مستلمًا واضحًا");
        const attachment = step.payload?.attachment as { url?: string; type?: string; name?: string; size?: number } | undefined;
        const { error: messageError } = await db.from("direct_messages").insert({ sender_id: userId, receiver_id: recipient.id, content, attachment_url: attachment?.url ?? null, attachment_type: attachment?.type ?? null, attachment_name: attachment?.name ?? null, attachment_size: attachment?.size ?? null });
        if (messageError) throw messageError;
        result = { ok: true, message: `تم إرسال الرسالة إلى ${recipient.full_name}` };
      } else if (step.action === "delete_conversation") {
        const conversationId = String(step.payload?.conversationId ?? "");
        if (!conversationId) throw new Error("معرّف المحادثة غير موجود");
        const { error: deleteError } = await db.from("ai_conversations").delete().eq("id", conversationId).eq("user_id", userId);
        if (deleteError) throw deleteError;
        result = { ok: true, message: "تم حذف المحادثة" };
      } else if (step.action === "report_conversation") {
        const title = String(step.payload?.title ?? "تبليغ من الوكيل");
        const description = String(step.payload?.description ?? "");
        const { error: reportError } = await db.from("ai_reports").insert({ user_id: userId, conversation_id: step.payload?.conversationId ?? null, title, description, conversation_snapshot: step.payload?.messages ?? [] });
        if (reportError) throw reportError;
        result = { ok: true, message: "تم إرسال التبليغ إلى المالك الأعلى" };
      } else {
        result = { ok: true, message: "تمت قراءة البيانات المطلوبة" };
      }
      results.push(result);
      await db.from("agent_audit_log").insert({ user_id: userId, action: step.action, details: { label: step.label, result }, conversation_id: run.conversation_id ?? null });
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
