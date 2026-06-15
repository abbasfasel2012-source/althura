import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
}
export interface NewsItem {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
}
export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  starts_at: string | null;
  created_at: string;
}
export interface BookItem {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  file_url: string;
  cover_url: string | null;
  created_at: string;
}
export interface GradeRecord {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  term: string;
  created_at: string;
}
export interface StudentRow {
  id: string;
  full_name: string;
  student_id: string | null;
  grade: string;
  section: string | null;
  email: string | null;
}

// ---------- Announcements ----------
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createAnnouncement(p: { title: string; body: string; pinned: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("announcements").insert({
    title: p.title, body: p.body, pinned: p.pinned, created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

// ---------- News ----------
export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createNews(p: { title: string; body: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("news").insert({
    title: p.title, body: p.body, created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteNews(id: string) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Events ----------
export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events").select("*").order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}
export async function createEvent(p: { title: string; description: string; location?: string; starts_at?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("events").insert({
    title: p.title, description: p.description,
    location: p.location ?? null,
    starts_at: p.starts_at ?? null,
    created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Books ----------
export async function fetchBooks(): Promise<BookItem[]> {
  const { data, error } = await supabase
    .from("books").select("*").order("created_at", { ascending: false });
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
    title: p.title,
    subject: p.subject ?? null,
    grade: p.grade ?? null,
    file_url: path,
    created_by: user?.id,
  });
  if (error) throw error;
}
export async function deleteBook(b: BookItem) {
  await supabase.storage.from("books").remove([b.file_url]).catch(() => {});
  const { error } = await supabase.from("books").delete().eq("id", b.id);
  if (error) throw error;
}

// ---------- Students / Grades ----------
export async function fetchStudents(): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, student_id, grade, section, email")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StudentRow[];
}

export async function fetchMyGrades(userId: string): Promise<GradeRecord[]> {
  const { data, error } = await supabase
    .from("grades_records")
    .select("*")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addGrade(p: { student_id: string; subject: string; score: number; term?: string }) {
  const { error } = await supabase.from("grades_records").insert({
    student_id: p.student_id,
    subject: p.subject,
    score: p.score,
    term: p.term ?? "الفصل الحالي",
  });
  if (error) throw error;
}

export async function deleteGrade(id: string) {
  const { error } = await supabase.from("grades_records").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Admin stats ----------
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

// ---------- Formatting ----------
export function ar(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-IQ", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}
