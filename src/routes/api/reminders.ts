import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticatedUser } from "@/lib/agent-auth.server";

export const Route = createFileRoute("/api/reminders")({ server: { handlers: {
  GET: async ({ request }) => {
    const userId = await authenticatedUser(request);
    if (!userId) return new Response("غير مصرح", { status: 401 });
    const now = new Date().toISOString();
    const db = supabaseAdmin as any;
    const { data, error } = await db.from("agent_reminders").select("id,title,note,remind_at").eq("user_id", userId).eq("done", false).is("notified_at", null).lte("remind_at", now).order("remind_at").limit(20);
    if (error) return new Response(error.message, { status: 500 });
    if (data?.length) await db.from("agent_reminders").update({ notified_at: now }).in("id", data.map((item: { id: string }) => item.id)).eq("user_id", userId);
    return Response.json(data ?? []);
  },
} } });
