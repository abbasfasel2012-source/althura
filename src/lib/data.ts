import { supabase } from "@/integrations/supabase/client";

// ==================== TYPES ====================

export interface Announcement {
  id: string; title: string; body: string; pinned: boolean; created_at: string;
}
export interface NewsItem {
  id: string; title: string; body: string; image_url: string | null; created_at: string;
}
export interface EventItem {
  id: string; title: string; description: string; location: string | null; starts_at: string | null; created_at: string;
}
export interface BookItem {
  id: string; title: string; subject: string | null; grade: string | null; file_url: string; cover_url: string | null; created_at: string;
}
export interface GradeRecord {
  id: string; student_id: string; subject: string; score: number; term: string; created_at: string;
}
export interface StudentRow {
  id: string; full_name: string; student_id: string | null; grade: string; section: string | null; email: string | null;
  is_teacher?: boolean; teaching_subject?: string | null; teaching_grade?: string | null; teaching_section?: string | null;
}
export interface PendingRegistration {
  id: string; full_name: string; student_id: string; grade: string; section: string | null;
  password_hash: string; status: "pending" | "approved" | "rejected";
  rejection_reason: string | null; created_at: string;
}
export interface ScheduleDay {
  id: string; day_index: number; day_name: string; is_holiday: boolean; holiday_label: string | null;
}
export interface SchedulePeriod {
  id: string; day_id: string; period_number: number; start_time: string;
  subject: string; teacher: string | null; room: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_private: boolean;
  allow_media?: boolean;
  created_at: string;
  members_count?: number;
  last_message?: string;
}

export type AttachmentType = "image" | "video" | "audio" | "file";

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  attachment_name: string | null;
  attachment_size: number | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  profiles?: { full_name: string };
  reactions?: Reaction[];
}

// ==================== ANNOUNCEMENTS ====================

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase.from("announcements").select("*")
    .order("pinned", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createAnnouncement(p: { title: string; body: string; pinned: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("announcements").insert({ title: p.title, body: p.body, pinned: p.pinned, created_by: user?.id });
  if (error) throw error;
}
export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

// ==================== NEWS ====================

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createNews(p: { title: string; body: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("news").insert({ title: p.title, body: p.body, created_by: user?.id });
  if (error) throw error;
}
export async function deleteNews(id: string) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
}

// ==================== EVENTS ====================

export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}
export async function createEvent(p: { title: string; description: string; location?: string; starts_at?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("events").insert({
    title: p.title, description: p.description,
    location: p.location ?? null, starts_at: p.starts_at ?? null, created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ==================== BOOKS ====================

export async function fetchBooks(): Promise<BookItem[]> {
  const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function signedBookUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("books").createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
export async function uploadBook(p: { file: File; title: string; subject?: string; grade?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const safe = p.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}_${safe}`;
  const up = await supabase.storage.from("books").upload(path, p.file);
  if (up.error) throw up.error;
  const { error } = await supabase.from("books").insert({
    title: p.title, subject: p.subject ?? null, grade: p.grade ?? null,
    file_url: path, created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteBook(b: BookItem) {
  await supabase.storage.from("books").remove([b.file_url]).catch(() => {});
  const { error } = await supabase.from("books").delete().eq("id", b.id);
  if (error) throw error;
}

// ==================== STUDENTS / GRADES ====================

export async function fetchStudents(): Promise<StudentRow[]> {
  const { data, error } = await supabase.from("profiles")
    .select("id, full_name, student_id, grade, section, email, is_teacher, teaching_subject, teaching_grade, teaching_section")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StudentRow[];
}
export async function fetchMyGrades(userId: string): Promise<GradeRecord[]> {
  const { data, error } = await supabase.from("grades_records").select("*")
    .eq("student_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function addGrade(p: { student_id: string; subject: string; score: number; term?: string }) {
  const { error } = await supabase.from("grades_records").insert({
    student_id: p.student_id, subject: p.subject, score: p.score, term: p.term ?? "الفصل الحالي",
  });
  if (error) throw error;
}
export async function deleteGrade(id: string) {
  const { error } = await supabase.from("grades_records").delete().eq("id", id);
  if (error) throw error;
}
export async function deleteUser(userId: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

// ==================== ADMIN STATS ====================

export async function fetchAdminStats() {
  const [students, anns, news, events, books] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
  ]);
  return {
    students: students.count ?? 0,
    announcements: anns.count ?? 0,
    news: news.count ?? 0,
    events: events.count ?? 0,
    books: books.count ?? 0,
  };
}

// ==================== PENDING REGISTRATIONS ====================

export async function fetchPendingRegistrations(): Promise<PendingRegistration[]> {
  const { data, error } = await supabase.from("pending_registrations").select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingRegistration[];
}
export async function approveRegistration(reg: PendingRegistration) {
  const email = `${reg.student_id.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@aladhra.school`;
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: reg.password_hash,
    options: {
      data: { full_name: reg.full_name, student_id: reg.student_id, grade: reg.grade, section: reg.section },
    },
  });
  if (signUpError && !/already registered/i.test(signUpError.message ?? "")) throw signUpError;
  const { error } = await supabase.from("pending_registrations")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", reg.id);
  if (error) throw error;
}
export async function rejectRegistration(id: string, reason: string) {
  const { error } = await supabase.from("pending_registrations")
    .update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteRegistration(id: string) {
  const { error } = await supabase.from("pending_registrations").delete().eq("id", id);
  if (error) throw error;
}

// ==================== WEEKLY SCHEDULE ====================

export async function fetchWeekSchedule(): Promise<ScheduleDay[]> {
  const { data, error } = await supabase.from("weekly_schedule").select("*").order("day_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleDay[];
}
export async function fetchDayPeriods(dayId: string): Promise<SchedulePeriod[]> {
  const { data, error } = await supabase.from("schedule_periods").select("*")
    .eq("day_id", dayId).order("period_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SchedulePeriod[];
}
export async function upsertPeriod(p: Omit<SchedulePeriod, "id">) {
  const { error } = await supabase.from("schedule_periods").upsert({ ...p }, { onConflict: "day_id,period_number" });
  if (error) throw error;
}
export async function deletePeriod(id: string) {
  const { error } = await supabase.from("schedule_periods").delete().eq("id", id);
  if (error) throw error;
}
export async function setDayHoliday(dayId: string, is_holiday: boolean, holiday_label?: string) {
  const { error } = await supabase.from("weekly_schedule")
    .update({ is_holiday, holiday_label: holiday_label ?? null })
    .eq("id", dayId);
  if (error) throw error;
}

// ==================== ADMIN LABELS ====================

export async function fetchAdmins() {
  const rolesRes = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (rolesRes.data ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles")
    .select("id, full_name, email, admin_label")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}
export async function setAdminLabel(userId: string, label: string) {
  const { error } = await supabase.from("profiles").update({ admin_label: label || null }).eq("id", userId);
  if (error) throw error;
}

// ==================== GROUPS & CHAT ====================

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Fetch members count and last message for each group in parallel
  const groupsWithMeta = await Promise.all(
    (data ?? []).map(async (g) => {
      const [{ count }, { data: lastMsg }] = await Promise.all([
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", g.id),
        supabase
          .from("messages")
          .select("content")
          .eq("group_id", g.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        ...g,
        members_count: count ?? 0,
        last_message: lastMsg?.content ?? undefined,
      };
    })
  );

  return groupsWithMeta;
}

export async function fetchMessages(groupId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(full_name)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function joinGroup(groupId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً");

  // Insert member (ignore if already exists)
  const { error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: user.id }, { onConflict: "group_id,user_id", ignoreDuplicates: true });
  if (error && !error.message?.includes("duplicate")) throw error;
}

export async function sendMessage(groupId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول للإرسال");

  // Auto-join group when sending first message
  await joinGroup(groupId);

  const { error } = await supabase.from("messages").insert({
    group_id: groupId,
    user_id: user.id,
    content: content.trim(),
  });
  if (error) throw error;
}

export async function createGroup(p: { name: string; description?: string; is_private?: boolean }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  const { error } = await supabase.from("groups").insert({
    name: p.name,
    description: p.description ?? null,
    is_private: p.is_private ?? false,
    created_by: user.id,
  });
  if (error) throw error;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

// ==================== HELPERS ====================

export function ar(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}
export function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("ar-IQ", { day: "numeric", month: "short" }); }
  catch { return iso; }
}

// ==================== TODAY / EXAMS / HOMEWORK ====================

export interface ExamItem {
  id: string; title: string; subject: string; exam_date: string; description: string | null; created_at: string;
}
export interface HomeworkItem {
  id: string; user_id: string; title: string; subject: string; due_date: string | null; done: boolean; created_at: string;
}

export async function fetchExams(): Promise<ExamItem[]> {
  const { data, error } = await supabase.from("exams").select("*").order("exam_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ExamItem[];
}

export async function fetchUpcomingExamsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("exams").select("id", { count: "exact", head: true })
    .gte("exam_date", new Date().toISOString());
  if (error) return 0;
  return count ?? 0;
}

export async function fetchMyHomework(userId: string): Promise<HomeworkItem[]> {
  const { data, error } = await supabase.from("homework").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HomeworkItem[];
}

export async function fetchTodayPeriods(): Promise<SchedulePeriod[]> {
  const dayIndex = new Date().getDay(); // 0..6 sun..sat
  const { data: day, error: dayErr } = await supabase
    .from("weekly_schedule").select("id, is_holiday")
    .eq("day_index", dayIndex).maybeSingle();
  if (dayErr || !day || day.is_holiday) return [];
  const { data, error } = await supabase.from("schedule_periods").select("*")
    .eq("day_id", day.id).order("period_number", { ascending: true });
  if (error) return [];
  return (data ?? []) as SchedulePeriod[];
}


// ==================== QUIZZES ====================

export type QuestionType = "mcq" | "true_false" | "text";

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  grade: string | null;
  section: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  position: number;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  status: "in_progress" | "submitted" | "graded";
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer: string | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  ai_feedback: string | null;
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quiz[];
}

export async function fetchQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> {
  const [{ data: quiz, error: qErr }, { data: questions, error: qsErr }] = await Promise.all([
    supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
    supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position", { ascending: true }),
  ]);
  if (qErr) throw qErr;
  if (qsErr) throw qsErr;
  if (!quiz) throw new Error("الاختبار غير موجود");
  return { quiz: quiz as Quiz, questions: (questions ?? []) as QuizQuestion[] };
}

export async function createQuiz(p: {
  title: string; subject: string; description?: string;
  grade?: string | null; section?: string | null; duration_minutes?: number;
  questions: Array<{ type: QuestionType; question: string; options?: string[]; correct_answer?: string; points?: number }>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: quiz, error } = await supabase.from("quizzes").insert({
    title: p.title, subject: p.subject, description: p.description ?? null,
    grade: p.grade ?? null, section: p.section ?? null,
    duration_minutes: p.duration_minutes ?? 30,
    created_by: user?.id,
  }).select().single();
  if (error) throw error;
  if (p.questions.length > 0) {
    const rows = p.questions.map((q, i) => ({
      quiz_id: quiz.id,
      position: i,
      type: q.type,
      question: q.question,
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? null,
      points: q.points ?? 1,
    }));
    const { error: qErr } = await supabase.from("quiz_questions").insert(rows);
    if (qErr) throw qErr;
  }
  return quiz.id as string;
}

export async function deleteQuiz(id: string) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) throw error;
}

export async function startOrGetAttempt(quizId: string): Promise<QuizAttempt> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { data: existing } = await supabase.from("quiz_attempts").select("*")
    .eq("quiz_id", quizId).eq("user_id", user.id).order("started_at", { ascending: false }).limit(1);
  if (existing && existing.length > 0) return existing[0] as QuizAttempt;
  const { data, error } = await supabase.from("quiz_attempts").insert({
    quiz_id: quizId, user_id: user.id,
  }).select().single();
  if (error) throw error;
  return data as QuizAttempt;
}

export async function fetchAttemptAnswers(attemptId: string): Promise<QuizAnswer[]> {
  const { data, error } = await supabase.from("quiz_answers").select("*").eq("attempt_id", attemptId);
  if (error) throw error;
  return (data ?? []) as QuizAnswer[];
}

// Submit + grade: auto-grade mcq/tf; call AI for text
export async function submitQuiz(args: {
  attemptId: string;
  quizId: string;
  answers: Record<string, string>; // question_id -> answer
}): Promise<QuizAttempt> {
  const { questions } = await fetchQuizWithQuestions(args.quizId);
  let totalScore = 0;
  let maxScore = 0;

  // First pass: auto-grade mcq / true_false
  const rows: Array<{ attempt_id: string; question_id: string; answer: string | null; is_correct: boolean | null; points_awarded: number; ai_feedback: string | null }> = [];
  const textQs: QuizQuestion[] = [];
  const textAnswers: string[] = [];

  for (const q of questions) {
    maxScore += q.points;
    const raw = args.answers[q.id] ?? "";
    if (q.type === "mcq" || q.type === "true_false") {
      const correct = (raw || "").trim() === (q.correct_answer || "").trim() && raw !== "";
      const pts = correct ? q.points : 0;
      totalScore += pts;
      rows.push({
        attempt_id: args.attemptId, question_id: q.id, answer: raw,
        is_correct: correct, points_awarded: pts, ai_feedback: null,
      });
    } else {
      textQs.push(q);
      textAnswers.push(raw);
      rows.push({
        attempt_id: args.attemptId, question_id: q.id, answer: raw,
        is_correct: null, points_awarded: 0, ai_feedback: null,
      });
    }
  }

  // AI grade text questions
  if (textQs.length > 0) {
    try {
      const res = await fetch("/api/grade-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: textQs.map((q, i) => ({
            question: q.question,
            reference: q.correct_answer ?? "",
            student_answer: textAnswers[i],
            max_points: q.points,
          })),
        }),
      });
      if (res.ok) {
        const graded = (await res.json()) as Array<{ score: number; feedback: string }>;
        for (let i = 0; i < textQs.length; i++) {
          const g = graded[i];
          const q = textQs[i];
          const row = rows.find((r) => r.question_id === q.id)!;
          const pts = Math.max(0, Math.min(q.points, Number(g?.score ?? 0)));
          row.points_awarded = pts;
          row.ai_feedback = g?.feedback ?? null;
          row.is_correct = pts >= q.points * 0.8;
          totalScore += pts;
        }
      }
    } catch {
      // AI failed — leave text ungraded (0 pts, no feedback)
    }
  }

  // Upsert answers
  const { error: aErr } = await supabase.from("quiz_answers").upsert(rows, { onConflict: "attempt_id,question_id" });
  if (aErr) throw aErr;

  const { data: updated, error: uErr } = await supabase.from("quiz_attempts").update({
    submitted_at: new Date().toISOString(),
    score: totalScore,
    max_score: maxScore,
    status: "graded",
  }).eq("id", args.attemptId).select().single();
  if (uErr) throw uErr;
  return updated as QuizAttempt;
}

// ==================== VIDEOS ====================

export interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  subject: string | null;
  grade: string | null;
  section: string | null;
  created_at: string;
}

export async function fetchVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VideoItem[];
}

export async function createVideo(p: {
  title: string; description?: string; video_url: string; thumbnail_url?: string;
  subject?: string; grade?: string | null; section?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("videos").insert({
    title: p.title,
    description: p.description ?? null,
    video_url: p.video_url,
    thumbnail_url: p.thumbnail_url ?? null,
    subject: p.subject ?? null,
    grade: p.grade ?? null,
    section: p.section ?? null,
    created_by: user?.id,
  });
  if (error) throw error;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

// YouTube helper: extract ID from various URL shapes
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch { /* not a url */ }
  return null;
}

// ==================== PROFILE (extended) ====================

export interface FullProfile {
  id: string;
  full_name: string;
  student_id: string | null;
  grade: string | null;
  section: string | null;
  email: string | null;
  admin_label: string | null;
  is_teacher: boolean;
  teaching_grade: string | null;
  teaching_section: string | null;
  teaching_subject: string | null;
  phone: string | null;
  bio: string | null;
}

export async function fetchProfileById(id: string): Promise<FullProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, student_id, grade, section, email, admin_label, is_teacher, teaching_grade, teaching_section, teaching_subject, phone, bio")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as FullProfile) ?? null;
}

// ==================== TEACHERS (from profiles) ====================

export interface TeacherProfile {
  id: string;
  full_name: string;
  teaching_subject: string | null;
  teaching_grade: string | null;
  teaching_section: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  admin_label: string | null;
}

export async function fetchTeacherProfiles(filter?: { grade?: string | null; section?: string | null }): Promise<TeacherProfile[]> {
  let q = supabase
    .from("profiles")
    .select("id, full_name, teaching_subject, teaching_grade, teaching_section, phone, email, bio, admin_label")
    .eq("is_teacher", true)
    .order("full_name", { ascending: true });
  if (filter?.grade) {
    q = q.or(`teaching_grade.is.null,teaching_grade.eq.${filter.grade}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  let list = (data ?? []) as TeacherProfile[];
  if (filter?.section) {
    list = list.filter((t) => !t.teaching_section || t.teaching_section === filter.section);
  }
  return list;
}

// ==================== DIRECT MESSAGES ====================

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export async function fetchDirectMessages(otherUserId: string): Promise<DirectMessage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DirectMessage[];
}

export async function sendDirectMessage(receiverId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { error } = await supabase.from("direct_messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim(),
  });
  if (error) throw error;
}

