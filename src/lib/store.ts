// Lightweight local data store for the school platform.
// Persists to localStorage; safe on the server (no-ops).

import { useEffect, useState } from "react";

export type Grade = "1" | "2" | "3" | "4" | "5" | "6" | "general" | "parent";
export type Section = "أ" | "ب" | "ج" | "د";

export interface User {
  fullName: string;
  grade: Grade;
  section?: Section;
  role: "student" | "owner" | "guest";
}

export const GRADE_NAMES: Record<Grade, string> = {
  "1": "الأول المتوسط",
  "2": "الثاني المتوسط",
  "3": "الثالث المتوسط",
  "4": "الرابع الإعدادي",
  "5": "الخامس الإعدادي",
  "6": "السادس الإعدادي",
  general: "طالب عام",
  parent: "ولي أمر",
};

const KEY = "aladhra.user.v1";

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setUser(u: User | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aladhra:user"));
}

export function useUser(): User | null {
  const [u, setU] = useState<User | null>(getUser());
  useEffect(() => {
    setU(getUser());
    const onChange = () => setU(getUser());
    window.addEventListener("aladhra:user", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("aladhra:user", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return u;
}

// Generic localStorage hook for small persisted prefs (theme, settings, notes...).
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw) as T);
    } catch {
      /* noop */
    }
  }, [key]);
  const set = (nv: T) => {
    setV(nv);
    try {
      localStorage.setItem(key, JSON.stringify(nv));
    } catch {
      /* noop */
    }
  };
  return [v, set];
}

// Localize digits to Arabic-Indic.
export function ar(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

// ---------- demo data ----------

export const TODAY_SCHEDULE = [
  { time: "٠٨:٠٠", subject: "اللغة العربية", room: "قاعة ٣", status: "done" as const },
  { time: "٠٩:٠٠", subject: "الفيزياء المتقدمة", room: "مختبر ١", status: "now" as const },
  { time: "١٠:٣٠", subject: "الرياضيات", room: "قاعة ٧", status: "next" as const },
  { time: "١٢:٠٠", subject: "اللغة الإنجليزية", room: "قاعة ٢", status: "next" as const },
  { time: "٠١:٠٠", subject: "الكيمياء", room: "مختبر ٢", status: "next" as const },
];

export const WEEK_SCHEDULE: { day: string; items: { time: string; subject: string }[] }[] = [
  { day: "الأحد", items: [
      { time: "٠٨:٠٠", subject: "اللغة العربية" },
      { time: "٠٩:٠٠", subject: "الإسلامية" },
      { time: "١٠:٣٠", subject: "الرياضيات" },
    ] },
  { day: "الاثنين", items: [
      { time: "٠٨:٠٠", subject: "اللغة العربية" },
      { time: "٠٩:٠٠", subject: "الفيزياء" },
      { time: "١٠:٣٠", subject: "الرياضيات" },
      { time: "١٢:٠٠", subject: "الإنجليزية" },
    ] },
  { day: "الثلاثاء", items: [
      { time: "٠٨:٠٠", subject: "الكيمياء" },
      { time: "٠٩:٠٠", subject: "الأحياء" },
      { time: "١٠:٣٠", subject: "اللغة العربية" },
    ] },
  { day: "الأربعاء", items: [
      { time: "٠٨:٠٠", subject: "الفيزياء" },
      { time: "٠٩:٠٠", subject: "الرياضيات" },
      { time: "١٠:٣٠", subject: "الإسلامية" },
    ] },
  { day: "الخميس", items: [
      { time: "٠٨:٠٠", subject: "الإنجليزية" },
      { time: "٠٩:٠٠", subject: "الحاسوب" },
      { time: "١٠:٣٠", subject: "الرياضة" },
    ] },
];

export const EXAMS = [
  { title: "اختبار الفيزياء الفصلي", date: "٢٠ تشرين الأول", subject: "الفيزياء", daysLeft: 3 },
  { title: "امتحان الكيمياء الشهري", date: "٢٤ تشرين الأول", subject: "الكيمياء", daysLeft: 7 },
  { title: "اختبار اللغة العربية", date: "٢٨ تشرين الأول", subject: "العربية", daysLeft: 11 },
];

export const HOMEWORK = [
  { title: "حل مسائل الحركة التوافقية", subject: "الفيزياء", due: "غداً", done: false },
  { title: "تحليل نص للمتنبي", subject: "العربية", due: "بعد يومين", done: false },
  { title: "ترجمة الفصل الثالث", subject: "الإنجليزية", due: "الأسبوع القادم", done: true },
  { title: "تجربة معايرة الحموض", subject: "الكيمياء", due: "الأحد", done: false },
];

export const ANNOUNCEMENTS = [
  { title: "تأجيل اختبار الكيمياء", body: "تم تأجيل اختبار الكيمياء الفصلي من يوم الخميس إلى يوم الأحد القادم بسبب إجازة رسمية.", date: "اليوم • ١٠:٢٠", tag: "مهم", pinned: true },
  { title: "اجتماع أولياء الأمور", body: "يُعقد اجتماع أولياء أمور الصف السادس يوم الثلاثاء الساعة الخامسة عصراً في قاعة المحاضرات.", date: "أمس • ٠٤:٠٠", tag: "إعلان", pinned: false },
  { title: "نتائج المسابقة العلمية", body: "أُعلنت نتائج المسابقة العلمية. مبارك لجميع الفائزين، التتويج يوم الخميس.", date: "قبل يومين", tag: "أخبار", pinned: false },
];

export const BOOKS = [
  { title: "الفيزياء — السادس العلمي", grade: "السادس", pages: 312, color: "from-amber-100 to-amber-200" },
  { title: "الكيمياء — السادس العلمي", grade: "السادس", pages: 284, color: "from-emerald-100 to-emerald-200" },
  { title: "الرياضيات — السادس", grade: "السادس", pages: 396, color: "from-stone-100 to-stone-200" },
  { title: "اللغة العربية — الأدب", grade: "السادس", pages: 228, color: "from-rose-100 to-rose-200" },
  { title: "اللغة الإنجليزية", grade: "السادس", pages: 198, color: "from-sky-100 to-sky-200" },
  { title: "الأحياء", grade: "السادس", pages: 264, color: "from-lime-100 to-lime-200" },
];

export const GROUPS = [
  { name: "كروب الصف السادس — أ", members: 38, last: "محمد: شكراً للأستاذ" },
  { name: "كروب الفيزياء", members: 142, last: "أحمد: أرسلت الملخص" },
  { name: "كروب عام — الذرى", members: 612, last: "الإدارة: تذكير بالاجتماع" },
];

export const NEWS = [
  { title: "تكريم أوائل الذرى الذكية لعام ٢٠٢٦", excerpt: "احتفلت المدرسة بتكريم الطلبة الأوائل في حفل مهيب…", date: "١٢ تشرين الأول" },
  { title: "افتتاح المختبر الجديد للذكاء الاصطناعي", excerpt: "تم افتتاح مختبر متخصص بأحدث الأجهزة لخدمة الطلبة…", date: "٠٥ تشرين الأول" },
];

export const EVENTS = [
  { title: "اليوم العلمي السنوي", when: "الخميس ٢٤ تشرين الأول", place: "القاعة الكبرى" },
  { title: "معرض الفنون والعلوم", when: "الأحد ٢٧ تشرين الأول", place: "ساحة المدرسة" },
];

export const TEACHERS = [
  { name: "أ. حيدر الموسوي", subject: "الفيزياء", years: 12, rating: 4.9 },
  { name: "أ. زينب الخفاجي", subject: "الكيمياء", years: 9, rating: 4.8 },
  { name: "أ. كرار العامري", subject: "الرياضيات", years: 15, rating: 4.9 },
  { name: "أ. فاطمة الحسيني", subject: "اللغة العربية", years: 11, rating: 4.7 },
  { name: "أ. علي البياتي", subject: "اللغة الإنجليزية", years: 8, rating: 4.6 },
  { name: "أ. مرتضى الجبوري", subject: "الأحياء", years: 7, rating: 4.7 },
];

export const GRADES_RESULTS = [
  { subject: "الفيزياء", score: 92, max: 100, trend: "+٣" },
  { subject: "الكيمياء", score: 87, max: 100, trend: "+١" },
  { subject: "الرياضيات", score: 95, max: 100, trend: "+٥" },
  { subject: "اللغة العربية", score: 89, max: 100, trend: "—" },
  { subject: "اللغة الإنجليزية", score: 84, max: 100, trend: "-٢" },
  { subject: "الأحياء", score: 90, max: 100, trend: "+٢" },
];

export const ACHIEVEMENTS = [
  { title: "متفوّق الشهر", desc: "أعلى معدل في الصف", icon: "🏆", unlocked: true },
  { title: "منجز الواجبات", desc: "أنجزت ٢٠ واجباً متتالياً", icon: "✅", unlocked: true },
  { title: "قارئ نهم", desc: "قرأت ٥ كتب هذا الفصل", icon: "📚", unlocked: true },
  { title: "بطل الكيمياء", desc: "علامة كاملة في تجربة المختبر", icon: "🧪", unlocked: false },
  { title: "مساهم نشط", desc: "١٠٠ رسالة في الكروبات", icon: "💬", unlocked: false },
];

export const CALENDAR_DAYS = [
  { day: 18, label: "اليوم", kind: "today" as const },
  { day: 20, label: "اختبار الفيزياء", kind: "exam" as const },
  { day: 22, label: "اجتماع الأهالي", kind: "event" as const },
  { day: 24, label: "اختبار الكيمياء", kind: "exam" as const },
  { day: 24, label: "اليوم العلمي", kind: "event" as const },
  { day: 27, label: "معرض الفنون", kind: "event" as const },
  { day: 28, label: "اختبار العربية", kind: "exam" as const },
];

export const STUDENT_STATS = {
  average: 89.5,
  attendance: 96,
  rank: 4,
  streak: 12,
};

