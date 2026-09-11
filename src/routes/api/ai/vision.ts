import { createFileRoute } from "@tanstack/react-router";
import { authenticatedUser } from "@/lib/agent-auth.server";

export const Route = createFileRoute("/api/ai/vision")({ server: { handlers: {
  POST: async ({ request }) => {
    const userId = await authenticatedUser(request);
    if (!userId) return new Response("غير مصرح", { status: 401 });
    const body = await request.json() as { url?: string; mimeType?: string };
    if (!body.url || !body.mimeType?.startsWith("image/")) return new Response("المرفق يجب أن يكون صورة", { status: 400 });
    const key = process.env.GOOGLE_API_KEY;
    if (!key) return new Response("خدمة الرؤية غير مهيأة", { status: 503 });
    const imageResponse = await fetch(body.url);
    if (!imageResponse.ok) return new Response("تعذّر قراءة الصورة", { status: 400 });
    const bytes = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "اقرأ النص الظاهر في الصورة بدقة. إذا كانت صورة واجب أو سؤال، استخرج السؤال كما هو دون حله. أعد النص بالعربية، واذكر إن كانت الصورة غير واضحة." }, { inline_data: { mime_type: body.mimeType, data: bytes } }] }], generationConfig: { temperature: 0.1 } }) });
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!response.ok) return new Response(result.error?.message ?? "فشلت قراءة الصورة", { status: 502 });
    return Response.json({ text: result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "" });
  },
} } });
