import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// السيرفر وحده يشوف correct_answer ويحسب الدرجة النهائية —
// الطالب ما يوصلها لا وقت الامتحان ولا يقدر يكتب درجته بنفسه.
export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      attemptId: z.string().uuid(),
      quizId: z.string().uuid(),
      answers: z.record(z.string(), z.string()),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // تأكد الطالب يملك هذه المحاولة وما زالت غير مُرسلة
    const { data: attempt, error: attemptErr } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, submitted_at")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (attemptErr) throw new Error(attemptErr.message);
    if (!attempt) throw new Error("المحاولة غير موجودة");
    if (attempt.user_id !== context.userId) throw new Error("هذه المحاولة ليست لك");
    if (attempt.submitted_at) throw new Error("تم إرسال هذا الاختبار مسبقاً");
    if (attempt.quiz_id !== data.quizId) throw new Error("بيانات غير متطابقة");

    const { data: questions, error: qErr } = await supabaseAdmin
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", data.quizId)
      .order("position", { ascending: true });
    if (qErr) throw new Error(qErr.message);
    if (!questions || questions.length === 0) throw new Error("لا توجد أسئلة لهذا الاختبار");

    let totalScore = 0;
    let maxScore = 0;

    const rows: Array<{
      attempt_id: string;
      question_id: string;
      answer: string | null;
      is_correct: boolean | null;
      points_awarded: number;
      ai_feedback: string | null;
    }> = [];
    const textQs: typeof questions = [];
    const textAnswers: string[] = [];

    for (const q of questions) {
      maxScore += q.points;
      const raw = data.answers[q.id] ?? "";
      if (q.type === "mcq" || q.type === "true_false") {
        const correct = (raw || "").trim() === (q.correct_answer || "").trim() && raw !== "";
        const pts = correct ? q.points : 0;
        totalScore += pts;
        rows.push({
          attempt_id: data.attemptId,
          question_id: q.id,
          answer: raw,
          is_correct: correct,
          points_awarded: pts,
          ai_feedback: null,
        });
      } else {
        textQs.push(q);
        textAnswers.push(raw);
        rows.push({
          attempt_id: data.attemptId,
          question_id: q.id,
          answer: raw,
          is_correct: null,
          points_awarded: 0,
          ai_feedback: null,
        });
      }
    }

    // تصحيح الأسئلة المقالية بالذكاء الاصطناعي — داخلياً على السيرفر فقط
    if (textQs.length > 0) {
      const key = process.env.LOVABLE_API_KEY;
      if (key) {
        const gateway = createLovableAiGatewayProvider(key);
        await Promise.all(
          textQs.map(async (q, i) => {
            const prompt = `أنت مصحح اختبارات عربي محايد. قيّم إجابة الطالب بموضوعية.

السؤال:
${q.question}

الإجابة المرجعية (قد تكون فارغة، وقتها اعتمد على معرفتك):
${q.correct_answer || "(لا توجد إجابة مرجعية)"}

إجابة الطالب:
${textAnswers[i] || "(لم يجب)"}

المطلوب: أعطِ درجة من ${q.points} (رقم عشري مسموح) وملاحظة قصيرة بالعربية توضح السبب ونقاط التحسين.
أعد الرد بصيغة JSON صارمة فقط، بدون أي نص إضافي، بالشكل:
{"score": <number>, "feedback": "<نص قصير>"}`;
            try {
              const { text } = await generateText({ model: gateway("google/gemini-3-flash-preview"), prompt });
              const match = text.match(/\{[\s\S]*\}/);
              const row = rows.find((r) => r.question_id === q.id)!;
              if (match) {
                const parsed = JSON.parse(match[0]) as { score: number; feedback: string };
                const pts = Math.max(0, Math.min(q.points, Number(parsed.score) || 0));
                row.points_awarded = pts;
                row.ai_feedback = String(parsed.feedback ?? "");
                row.is_correct = pts >= q.points * 0.8;
                totalScore += pts;
              }
            } catch {
              // فشل التصحيح الآلي — تبقى 0 نقطة بانتظار مراجعة يدوية
            }
          }),
        );
      }
    }

    const { error: aErr } = await supabaseAdmin
      .from("quiz_answers")
      .upsert(rows, { onConflict: "attempt_id,question_id" });
    if (aErr) throw new Error(aErr.message);

    const { data: updated, error: uErr } = await supabaseAdmin
      .from("quiz_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        score: totalScore,
        max_score: maxScore,
        status: "graded",
      })
      .eq("id", data.attemptId)
      .select()
      .single();
    if (uErr) throw new Error(uErr.message);

    return updated;
  });
