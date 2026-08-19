import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// أخطاء Supabase (PostgrestError, AuthError...) أجسام عادية فيها .message،
// مو Error حقيقية — استخدام (error instanceof Error) بس كان يفشل بصمت
// ويطلع "[object Object]" للمستخدم. هذي الدالة تتعامل مع الحالتين.
export function getErrorMessage(error: unknown, fallback = "صار خطأ غير متوقع"): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
