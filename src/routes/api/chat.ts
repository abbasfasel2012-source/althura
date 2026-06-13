import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY غير مهيأ", { status: 500 });
        }
        const { messages }: { messages: UIMessage[] } = await request.json();
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system:
            "أنت عبوسي، مساعد أكاديمي عربي للطلاب في ثانوية الذرى. أجب باللغة العربية الفصحى، بأسلوب ودود ومختصر وواضح. اشرح الدروس بأمثلة عملية، وساعد الطالب في الواجبات والامتحانات.",
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
