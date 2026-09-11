import { createFileRoute } from "@tanstack/react-router";
import { authenticatedUser } from "@/lib/agent-auth.server";
import { createAgentRun, executeAgentRun, planAgentRequest } from "@/lib/agent.server";
import { loadStudentContext } from "@/lib/student-context.server";

export const Route = createFileRoute("/api/agent")({ server: { handlers: {
  POST: async ({ request }) => {
    const userId = await authenticatedUser(request);
    if (!userId) return new Response("غير مصرح", { status: 401 });
    const body = await request.json() as { request?: string; conversationId?: string; attachment?: { url: string; path: string; name: string; size: number; type: string } };
    if (!body.request?.trim()) return new Response("الطلب مطلوب", { status: 400 });
    const context = await loadStudentContext(userId).catch(() => "");
    const plan = await planAgentRequest(body.request.trim(), context);
    if (body.attachment) {
      for (const step of plan.steps) if (step.action === "send_message") step.payload = { ...step.payload, attachment: body.attachment };
    }
    const runId = await createAgentRun(userId, body.request.trim(), plan, body.conversationId ?? null);
    return Response.json({ runId, plan });
  },
  PATCH: async ({ request }) => {
    const userId = await authenticatedUser(request);
    if (!userId) return new Response("غير مصرح", { status: 401 });
    const body = await request.json() as { runId?: string; confirmed?: boolean };
    if (!body.runId || !body.confirmed) return new Response("يلزم تأكيد الخطة", { status: 400 });
    const results = await executeAgentRun(userId, body.runId);
    return Response.json({ ok: true, results });
  },
} } });
