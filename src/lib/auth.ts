// Real Supabase-backed auth for الذرى platform.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setUser as setLocalUser } from "@/lib/store";

export const OWNER_EMAIL = "abbasfasel2012@gmail.com";

// Convert a student id (e.g. "6A001") to a synthetic email so we can use
// Supabase's email/password auth without exposing real email addresses.
export function studentIdToEmail(id: string): string {
  return `${id.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@aladhra.school`;
}

export interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: {
    full_name: string;
    student_id: string | null;
    grade: string;
    section: string | null;
  } | null;
  role: "admin" | "student" | null;
  isOwner: boolean;
}

const initial: AuthState = {
  loading: true,
  userId: null,
  email: null,
  profile: null,
  role: null,
  isOwner: false,
};

let cached: AuthState = initial;
const listeners = new Set<(s: AuthState) => void>();

function emit(next: AuthState) {
  cached = next;
  listeners.forEach((l) => l(next));
}

async function loadProfileAndRole(userId: string, email: string | null) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, student_id, grade, section")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const role = roles?.find((r) => r.role === "admin")
    ? "admin"
    : roles && roles.length > 0
    ? "student"
    : null;

  const state: AuthState = {
    loading: false,
    userId,
    email,
    profile: profile ?? null,
    role,
    isOwner: role === "admin",
  };

  // Mirror into the legacy localStorage user shape so existing UI keeps working.
  if (profile) {
    setLocalUser({
      fullName: profile.full_name || email || "طالب",
      grade: (profile.grade as never) ?? "6",
      section: (profile.section as never) ?? undefined,
      role: role === "admin" ? "owner" : "student",
    });
  }

  emit(state);
}

let initialized = false;
function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    const s = data.session;
    if (s) loadProfileAndRole(s.user.id, s.user.email ?? null);
    else emit({ ...initial, loading: false });
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      setLocalUser(null);
      emit({ ...initial, loading: false });
    } else {
      loadProfileAndRole(session.user.id, session.user.email ?? null);
    }
  });
}

export function useAuth(): AuthState {
  const [s, setS] = useState<AuthState>(cached);
  useEffect(() => {
    init();
    setS(cached);
    const l = (n: AuthState) => setS(n);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}

// ---------- Actions ----------

export async function signInStudent(studentId: string, password: string) {
  const email = studentIdToEmail(studentId);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpStudent(args: {
  studentId: string;
  password: string;
  fullName: string;
  grade: string;
  section?: string;
}) {
  const email = studentIdToEmail(args.studentId);
  const { error } = await supabase.auth.signUp({
    email,
    password: args.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: args.fullName,
        student_id: args.studentId,
        grade: args.grade,
        section: args.section ?? null,
      },
    },
  });
  if (error) throw error;
}

export async function signInOwner(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpOwner(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: "مالك المنصة", grade: "general" },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
  setLocalUser(null);
}
