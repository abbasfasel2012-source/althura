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
  created_at: string;
  members_count?: number;
  last_message?: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
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
    .select("id, full_name, student_id, grade, section, email")
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
