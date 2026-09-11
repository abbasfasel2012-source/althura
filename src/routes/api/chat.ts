import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { bookContext, searchBooks } from "@/lib/book-rag.server";
import { loadStudentContext } from "@/lib/student-context.server";
import { shouldUseWebSearch, webSearchWithGemini } from "@/lib/ai-workspace.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function authenticatedUserId(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(token);
  return !error ? (data?.claims?.sub ?? null) : null;
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
        const userId = await authenticatedUserId(request);
        if (!userId) return new Response("غير مصرح — سجّل الدخول أولاً", { status: 401 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY غير مهيأ", { status: 500 });

        const { messages }: { messages: UIMessage[] } = await request.json();
        const question = lastUserQuestion(messages);
        let books = "";
        let student = "";
        let web = "";
        try {
          [student, books] = await Promise.all([
            loadStudentContext(userId),
            question ? searchBooks(question).then(bookContext).catch((error) => {
              console.error("فشل البحث في الكتب:", error);
              return "";
            }) : "",
          ]);
          if (await shouldUseWebSearch(question, books)) {
            web = await webSearchWithGemini(question).catch((error) => {
              console.error("فشل البحث في الويب:", error);
              return "";
            });
          }
        } catch (error) {
          console.error("فشل تحميل سياق الطالب:", error);
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `أنت عبوسي، مساعد أكاديمي عربي لطلاب ثانوية الذرى.

أجب باللغة العربية الفصحى أو باللهجة العراقية إذا استخدم الطالب اللهجة العراقية. كن ودودًا ومختصرًا وواضحًا، واستخدم Markdown صحيحًا.

سياق الطالب الحالي (للقراءة فقط):
${student || "لا تتوفر بيانات الطالب الآن."}

قواعد بيانات الطالب:
- استخدم الاسم عند الحاجة، وذكّر الطالب بدرجاته أو واجباته عندما يكون ذلك مفيدًا.
- إذا قال الطالب «واجبي» أو «واجب الرياضيات» فطابقه مع قائمة واجباته الحالية، ثم اشرح طريقة الحل أو اطلب نص السؤال إذا لم يكن نص السؤال محفوظًا.
- استخدم الدرجات لتقديم اقتراحات تحسين عملية، ولا تصدر أحكامًا جارحة.
- لا تذكر البريد الإلكتروني أو المعرّف الداخلي أو أي بيانات حساسة إلا إذا طلبها الطالب صراحة.
- لا تكشف رسائل الطالب الخاصة أو تعيد سردها إلا إذا كانت ضرورية للإجابة.
- لا تغيّر أي درجة أو واجب أو رسالة أو حساب، ولا تدّعِ أنك غيّرتها. أنت للقراءة والإرشاد فقط.

${books ? `مقاطع من الكتب المرفوعة:
${books}
اذكر اسم الكتاب ورقم الصفحة عند الاعتماد على هذه المقاطع.` : "لم يُعثر على مقاطع مناسبة من الكتب المرفوعة. لا تخترع مصدرًا أو رقم صفحة."}

${web ? `نتيجة بحث حديثة من الويب:
${web}
اذكر أن هذه المعلومة من الويب، وحافظ على روابط المصادر التي ظهرت في النتيجة.` : "لم تكن هناك حاجة إلى البحث في الويب لهذا السؤال."}

إذا لم تجد الإجابة في الكتب أو بيانات الطالب، قل ذلك بوضوح.
لا تخترع درجات أو واجبات أو مصادر.
- استخدم **النص العريض** للمصطلحات المهمة.
- استخدم العناوين والقوائم عند الحاجة.`,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
