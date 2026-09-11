import { supabaseAdmin } from "@/integrations/supabase/client.server";

function clean(value: unknown, max = 240) {
  return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

export async function loadStudentContext(userId: string) {
  const db = supabaseAdmin as any;
  const [profile, grades, homework, messages, attempts] = await Promise.all([
    db.from("profiles").select("full_name,student_id,grade,section,email").eq("id", userId).maybeSingle(),
    db.from("grades_records").select("subject,score,term,created_at").eq("student_id", userId).order("created_at", { ascending: false }).limit(80),
    db.from("homework").select("title,subject,due_date,done,created_at").eq("user_id", userId).order("done", { ascending: true }).order("created_at", { ascending: false }).limit(80),
    db.from("messages").select("content,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    db.from("quiz_attempts").select("quiz_id,score,max_score,status,submitted_at,started_at").eq("user_id", userId).order("started_at", { ascending: false }).limit(40),
  ]);

  const sections: string[] = [];
  if (profile.data) {
    const p = profile.data;
    sections.push(`بيانات الطالب:\nالاسم: ${clean(p.full_name)}\nالصف: ${clean(p.grade)}\nالشعبة: ${clean(p.section) || "غير محددة"}`);
  }
  if (grades.data?.length) {
    sections.push(`درجات الطالب:\n${grades.data.map((g: any) => `- ${clean(g.subject)}: ${clean(g.score)} من 100، ${clean(g.term)}`).join("\n")}`);
  }
  if (homework.data?.length) {
    sections.push(`واجبات الطالب:\n${homework.data.map((h: any) => `- ${clean(h.title)} | المادة: ${clean(h.subject)} | الحالة: ${h.done ? "منجز" : "غير منجز"} | التسليم: ${h.due_date ? clean(h.due_date, 40) : "غير محدد"}`).join("\n")}`);
  }
  if (messages.data?.length) {
    sections.push(`آخر رسائل الطالب التي كتبها بنفسه (للاستفادة من السياق فقط):\n${messages.data.map((m: any) => `- ${clean(m.content)} (${clean(m.created_at, 40)})`).join("\n")}`);
  }
  if (attempts.data?.length) {
    sections.push(`محاولات الاختبارات الخاصة بالطالب:\n${attempts.data.map((a: any) => `- الاختبار ${clean(a.quiz_id, 50)} | الدرجة: ${clean(a.score)} من ${clean(a.max_score)} | الحالة: ${clean(a.status)}`).join("\n")}`);
  }
  return sections.join("\n\n");
}
