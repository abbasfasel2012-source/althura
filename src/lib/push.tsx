// Live notifications: realtime inserts → in-app toast + device push notification.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

// ── VAPID public key (generated once, safe to expose in client) ────────────
export const VAPID_PUBLIC_KEY =
  "BBsRWzdth23DSAKvPDTdfccPipf7xu1lOPsCNKjdM_DSmzrGBwJaFuC1MhN7LrRLzOwtuIArQ6zbzh6BnDuJhCo";

// ── Types ──────────────────────────────────────────────────────────────────
export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function getPushPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

// ── Subscription management ────────────────────────────────────────────────

/** حوّل base64url → Uint8Array (مطلوب لـ pushManager.subscribe) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * اطلب إذن الإشعارات، اشترك في Web Push، واحفظ الـ subscription في Supabase.
 * استدعِ هذه الدالة بعد تسجيل الدخول أو عند ضغط زر "فعّل الإشعارات".
 */
export async function subscribeToPush(userId: string): Promise<PushPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";

  // 1. طلب الإذن
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission as PushPermission;

  try {
    // 2. انتظر تسجيل الـ Service Worker
    const reg = await navigator.serviceWorker.ready;

    // 3. اشترك في Push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { endpoint, keys } = sub.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    // 4. احفظ في Supabase (upsert لتجنب التكرار)
    await supabase.from("push_subscriptions").upsert(
      { user_id: userId, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
      { onConflict: "user_id,endpoint" },
    );

    return "granted";
  } catch {
    return "denied";
  }
}

/** فعّل إشعارات الجهاز للمستخدم الحالي (يستخدم في الإعدادات) */
export async function enableDeviceNotifications(): Promise<PushPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const permission = await Notification.requestPermission();
    return permission as PushPermission;
  }
  return subscribeToPush(user.id);
}

/** إلغاء الاشتراك وحذفه من Supabase */
export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from("push_subscriptions").delete()
    .eq("user_id", userId)
    .eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/**
 * أرسل إشعار Push عبر Edge Function.
 * - بدون user_ids → لكل المشتركين (للإعلانات العامة)
 * - مع user_ids   → لمستخدمين محددين (للرسائل المباشرة)
 */
export async function triggerPush({
  title,
  body,
  url,
  user_ids,
}: {
  title: string;
  body: string;
  url?: string;
  user_ids?: string[];
}): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ title, body, url, user_ids }),
      },
    );
  } catch { /* الإشعار اختياري — لا يوقف تدفق التطبيق */ }
}

// ── In-app notification helper ─────────────────────────────────────────────
function pref(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v) === true;
  } catch {
    return fallback;
  }
}

function notify(title: string, body: string) {
  if (!pref("aladhra.notif", true)) return;
  toast(title, { description: body });
  if (pref("aladhra.vibrate", false) && "vibrate" in navigator) navigator.vibrate?.(30);
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon: "/icon-512.png", badge: "/icon-512.png" });
    }
  } catch { /* ignore */ }
}

// ── LiveNotifications component (mounted once in app tree) ─────────────────
/** Mounted once in the app shell tree. */
export function LiveNotifications() {
  const { userId } = useAuth();
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const tr = (k: string) => tRef.current(k);
    const channel = supabase
      .channel("live-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (p) => {
        const row = p.new as { title?: string; body?: string };
        notify(tr("push.announcement"), row.title ?? "");
        window.dispatchEvent(new Event("aladhra:notif-new"));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news" }, (p) => {
        const row = p.new as { title?: string };
        notify(tr("push.news"), row.title ?? "");
        window.dispatchEvent(new Event("aladhra:notif-new"));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" }, (p) => {
        const row = p.new as { title?: string };
        notify(tr("push.event"), row.title ?? "");
        window.dispatchEvent(new Event("aladhra:notif-new"));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exams" }, (p) => {
        const row = p.new as { title?: string };
        notify(tr("push.exam"), row.title ?? "");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Direct messages addressed to the signed-in user.
  useEffect(() => {
    if (!userId) return;
    const tr = (k: string) => tRef.current(k);
    const channel = supabase
      .channel(`live-dm-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${userId}` },
        (p) => {
          const row = p.new as { content?: string };
          if (location.pathname.startsWith("/dm/")) return;
          notify(tr("push.dm"), row.content?.slice(0, 120) ?? "");
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // تفعيل Push subscription تلقائياً عند وجود إذن مسبق
  useEffect(() => {
    if (!userId) return;
    if (Notification.permission === "granted") {
      subscribeToPush(userId).catch(() => {});
    }
  }, [userId]);

  return null;
}
