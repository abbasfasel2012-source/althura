import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function authUser(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(value.slice(7));
  return error ? null : (data?.claims?.sub ?? null);
}

export const Route = createFileRoute("/api/ai/actions")({ server: { handlers: {
  POST: async ({ request }) => {
    const userId = await authUser(request);
    if (!userId) return new Response("غير مصرح", { status: 401 });
    const body = await request.json() as { action?: "send_message"; confirmed?: boolean; recipientName?: string; content?: string };
    if (body.action !== "send_message" || !body.confirmed || !body.recipientName?.trim() || !body.content?.trim()) return new Response("يجب تأكيد الطلب وتحديد المستلم والرسالة", { status: 400 });
    const db = supabaseAdmin as any;
    const { data: recipients } = await db.from("profiles").select("id,full_name").ilike("full_name", `%${body.recipientName.trim()}%`).limit(5);
    const recipient = recipients?.[0];
    if (!recipient || recipient.id === userId) return new Response("لم أجد مستلمًا واضحًا بهذا الاسم", { status: 404 });
    const { error } = await db.from("direct_messages").insert({ sender_id: userId, receiver_id: recipient.id, content: body.content.trim() });
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true, recipient: recipient.full_name });
  },
} } });
