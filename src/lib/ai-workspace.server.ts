import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ChatRecord = { role: "user" | "assistant"; content: string };

export async function webSearchWithGemini(question: string) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return "";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `ابحث في الويب عن السؤال الآتي، واستخدم مصادر حديثة وموثوقة. أعد خلاصة قصيرة بالعربية مع روابط المصادر: ${question}` }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1 },
    }),
  });
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? "تعذّر البحث في الويب");
  return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim() ?? "";
}

export async function saveConversationMessages(userId: string, conversationId: string | null, records: ChatRecord[]) {
  const db = supabaseAdmin as any;
  let id = conversationId;
  if (!id) {
    const title = records.find((r) => r.role === "user")?.content.slice(0, 80) || "محادثة جديدة";
    const { data, error } = await db.from("ai_conversations").insert({ user_id: userId, title }).select("id").single();
    if (error) throw error;
    id = data.id;
  }
  const { error } = await db.from("ai_conversation_messages").insert(records.map((record) => ({
    conversation_id: id, user_id: userId, role: record.role, content: record.content,
  })));
  if (error) throw error;
  await db.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  return id;
}

export async function userIsSuperOwner(userId: string) {
  const { data } = await (supabaseAdmin as any).from("profiles").select("is_super_owner").eq("id", userId).maybeSingle();
  return !!data?.is_super_owner;
}
