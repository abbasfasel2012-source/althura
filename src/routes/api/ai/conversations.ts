import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function authUser(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(value.slice(7));
  return error ? null : (data?.claims?.sub ?? null);
}

export const Route = createFileRoute("/api/ai/conversations")({
  server: { handlers: {
    GET: async ({ request }) => {
      const userId = await authUser(request);
      if (!userId) return new Response("غير مصرح", { status: 401 });
      const { data, error } = await (supabaseAdmin as any).from("ai_conversations").select("id,title,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(100);
      if (error) return new Response(error.message, { status: 500 });
      return Response.json(data ?? []);
    },
    POST: async ({ request }) => {
      const userId = await authUser(request);
      if (!userId) return new Response("غير مصرح", { status: 401 });
      const body = await request.json() as { conversationId?: string; title?: string; messages?: Array<{ role: "user" | "assistant"; content: string }> };
      const db = supabaseAdmin as any;
      let conversationId = body.conversationId;
      if (!conversationId) {
        const { data, error } = await db.from("ai_conversations").insert({ user_id: userId, title: body.title?.slice(0, 100) || "محادثة جديدة" }).select("id").single();
        if (error) return new Response(error.message, { status: 500 });
        conversationId = data.id;
      }
      if (body.messages?.length) {
        const { data: owned } = await db.from("ai_conversations").select("id").eq("id", conversationId).eq("user_id", userId).maybeSingle();
        if (!owned) return new Response("المحادثة غير متاحة", { status: 403 });
        await db.from("ai_conversation_messages").delete().eq("conversation_id", conversationId).eq("user_id", userId);
        const { error } = await db.from("ai_conversation_messages").insert(body.messages.map((message) => ({ conversation_id: conversationId, user_id: userId, role: message.role, content: message.content.slice(0, 20000) })));
        if (error) return new Response(error.message, { status: 500 });
        await db.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", userId);
      }
      return Response.json({ conversationId });
    },
    PATCH: async ({ request }) => {
      const userId = await authUser(request);
      if (!userId) return new Response("غير مصرح", { status: 401 });
      const body = await request.json() as { conversationId?: string; title?: string };
      if (!body.conversationId || !body.title?.trim()) return new Response("البيانات ناقصة", { status: 400 });
      const { error } = await (supabaseAdmin as any).from("ai_conversations").update({ title: body.title.trim().slice(0, 100) }).eq("id", body.conversationId).eq("user_id", userId);
      if (error) return new Response(error.message, { status: 500 });
      return Response.json({ ok: true });
    },
    DELETE: async ({ request }) => {
      const userId = await authUser(request);
      if (!userId) return new Response("غير مصرح", { status: 401 });
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return new Response("المحادثة غير محددة", { status: 400 });
      const { error } = await (supabaseAdmin as any).from("ai_conversations").delete().eq("id", id).eq("user_id", userId);
      if (error) return new Response(error.message, { status: 500 });
      return Response.json({ ok: true });
    },
  } },
});
