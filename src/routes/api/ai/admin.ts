import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticatedUser } from "@/lib/agent-auth.server";
import { userIsSuperOwner } from "@/lib/ai-workspace.server";

export const Route = createFileRoute("/api/ai/admin")({ server: { handlers: {
  DELETE: async ({ request }) => {
    const userId = await authenticatedUser(request);
    if (!userId || !(await userIsSuperOwner(userId))) return new Response("غير مصرح", { status: 403 });
    const id = new URL(request.url).searchParams.get("conversationId");
    if (!id) return new Response("المحادثة غير محددة", { status: 400 });
    const { error } = await (supabaseAdmin as any).from("ai_conversations").delete().eq("id", id);
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
  },
} } });
