import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function authUser(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(value.slice(7));
  return error ? null : (data?.claims?.sub ?? null);
}

export const Route = createFileRoute("/api/ai/report")({
  server: { handlers: {
    POST: async ({ request }) => {
      const userId = await authUser(request);
      const body = await request.json() as { conversationId?: string; title?: string; description?: string; messages?: unknown[]; automatic?: boolean };
      if (!userId && !body.automatic) return new Response("غير مصرح", { status: 401 });
      if (!body.title?.trim() || !body.description?.trim()) return new Response("عنوان المشكلة ووصفها مطلوبان", { status: 400 });
      const { error } = await (supabaseAdmin as any).from("ai_reports").insert({
        user_id: userId,
        conversation_id: body.conversationId ?? null,
        title: body.title.trim().slice(0, 160),
        description: body.description.trim().slice(0, 5000),
        conversation_snapshot: Array.isArray(body.messages) ? body.messages.slice(-80) : [],
      });
      if (error) return new Response(error.message, { status: 500 });
      return Response.json({ ok: true });
    },
  } },
});
