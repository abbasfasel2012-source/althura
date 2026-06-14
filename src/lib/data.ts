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

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminStats() {
  const [students, anns, news, events] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
  ]);
  return {
    students: students.count ?? 0,
    announcements: anns.count ?? 0,
    news: news.count ?? 0,
    events: events.count ?? 0,
  };
}

export async function createAnnouncement(p: { title: string; body: string; pinned: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("announcements").insert({
    title: p.title,
    body: p.body,
    pinned: p.pinned,
    created_by: user?.id,
  });
  if (error) throw error;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
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

export async function createEvent(p: { title: string; description: string; location?: string; starts_at?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("events").insert({
    title: p.title,
    description: p.description,
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
