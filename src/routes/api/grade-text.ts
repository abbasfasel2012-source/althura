import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ملاحظة: هذا المسار غير مستخدم من الواجهة بعد الآن (التصحيح صار عبر
// submitQuizAttempt السيرفري). أبقيناه محمياً بمصادقة تحسباً لأي استخدام مستقبلي،
// بدل ما نحذفه ونكسر التوليد الآلي لجدول المسارات.
async function requireAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  return !error && !!data?.claims?.sub;
}

interface GradeItem {
  question: string;
  reference: string;
  student_answer: string;
  max_points: number;
}

export const Route = createFileRoute("/api/grade-text")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await requireAuth(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY missing", { status: 500 });
        const { items }: { items: GradeItem[] } = await request.json();
        if (!Array.isArray(items) || items.length === 0) {
          return Response.json([]);
        }
        const gateway = createLovableAiGatewayProvider(key);

        const results: Array<{ score: number; feedback: string }> = [];
        // Grade each in parallel with a small cap
        await Promise.all(
          items.map(async (it, idx) => {
            const prompt = `أنت مصحح اختبارات عربي محايد. قيّم إجابة الطالب بموضوعية.

السؤال:
${it.question}

الإجابة المرجعية (قد تكون فارغة، وقتها اعتمد على معرفتك):
${it.reference || "(لا توجد إجابة مرجعية)"}

إجابة الطالب:
${it.student_answer || "(لم يجب)"}

المطلوب: أعطِ درجة من ${it.max_points} (رقم عشري مسموح) وملاحظة قصيرة بالعربية توضح السبب ونقاط التحسين.
أعد الرد بصيغة JSON صارمة فقط، بدون أي نص إضافي، بالشكل:
{"score": <number>, "feedback": "<نص قصير>"}`;

            try {
              const { text } = await generateText({
                model: gateway("google/gemini-3-flash-preview"),
                prompt,
              });
              // Extract first JSON object
              const match = text.match(/\{[\s\S]*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]) as { score: number; feedback: string };
                results[idx] = {
                  score: Number(parsed.score) || 0,
                  feedback: String(parsed.feedback ?? ""),
                };
                return;
              }
              results[idx] = { score: 0, feedback: text.slice(0, 200) };
            } catch (e) {
              results[idx] = { score: 0, feedback: "تعذّر التصحيح الآلي." };
            }
          }),
        );

        return Response.json(results);
      },
    },
  },
});
