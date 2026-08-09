// Live notifications: realtime inserts -> in-app toast + device notification.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function getPushPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

export async function enableDeviceNotifications(): Promise<PushPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    const res = await Notification.requestPermission();
    return res as PushPermission;
  } catch {
    return "denied";
  }
}

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

  return null;
}
