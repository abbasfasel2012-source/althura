import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// يمنع أي زائر غير مسجّل دخول من استهلاك مفتاح Lovable AI Gateway مباشرة.
async function requireAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  return !error && !!data?.claims?.sub;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await requireAuth(request))) {
          return new Response("غير مصرح — سجّل الدخول أولاً", { status: 401 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY غير مهيأ", { status: 500 });
        }
        const { messages }: { messages: UIMessage[] } = await request.json();
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system:
            "أنت عبوسي، مساعد أكاديمي عربي للطلاب في ثانوية الذرى. أجب باللغة العربية الفصحى بأسلوب ودود ومختصر وواضح. اشرح الدروس بأمثلة عملية. \n\nنسّق إجاباتك دائماً بصيغة Markdown صحيحة:\n- استخدم **النص العريض** للمصطلحات المهمة (وليس # قبل الكلمة).\n- استخدم العناوين ## و ### للأقسام الكبيرة فقط.\n- استخدم القوائم النقطية (- ) أو المرقمة (1. ) لتنظيم الخطوات.\n- ضع الصيغ والرموز داخل `code` للوضوح.\n- لا تكتب رمز # ملتصق بالنص بدون مسافة. لا تستخدم # كزخرفة.",
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
