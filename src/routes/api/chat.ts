import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { bookContext, searchBooks } from "@/lib/book-rag.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function requireAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(token);
  return !error && !!data?.claims?.sub;
}

function lastUserQuestion(messages: UIMessage[]) {
  const message = [...messages].reverse().find((item) => item.role === "user");
  return message?.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim() ?? "";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await requireAuth(request))) {
          return new Response("غير مصرح — سجّل الدخول أولاً", { status: 401 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY غير مهيأ", { status: 500 });

        const { messages }: { messages: UIMessage[] } = await request.json();
        const question = lastUserQuestion(messages);
        let context = "";
        if (question) {
          try {
            const matches = await searchBooks(question);
            context = bookContext(matches);
          } catch (error) {
            console.error("فشل البحث في الكتب:", error);
          }
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `أنت عبوسي، مساعد أكاديمي عربي لطلاب ثانوية الذرى.

أجب باللغة العربية الفصحى بأسلوب ودود ومختصر وواضح. استخدم Markdown صحيحًا.

${context ? `هذه مقاطع مسترجعة من الكتب المرفوعة. اعتمد عليها عند الإجابة، ولا تضف معلومات تخالفها:
${context}

اذكر في نهاية الإجابة اسم الكتاب ورقم الصفحة من المقاطع عند توفرهما.` : "لم يُعثر على مقاطع مناسبة من الكتب المرفوعة. لا تدّعِ أن الإجابة مأخوذة من الكتب، وإذا كان السؤال عن محتوى الكتب فقل: لم أجد هذه المعلومة في الكتب المرفوعة."}

إذا لم تجد الإجابة في السياق، قل بوضوح: لم أجد هذه المعلومة في الكتب المرفوعة.
لا تخترع مصادر أو أرقام صفحات.
- استخدم **النص العريض** للمصطلحات المهمة.
- استخدم العناوين ## و ### للأقسام الكبيرة فقط.
- استخدم القوائم النقطية أو المرقمة عند الحاجة.
- ضع الصيغ والرموز داخل علامات التنسيق المناسبة عند الحاجة.`,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
