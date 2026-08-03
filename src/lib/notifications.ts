// Tracks unseen announcements/news/events using a localStorage timestamp.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "aladhra.notif.lastSeen";

function getLastSeen(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(KEY);
  return v ? Number(v) || 0 : 0;
}

export function markNotificationsSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(Date.now()));
  window.dispatchEvent(new Event("aladhra:notif"));
}

let cachedLatest = 0;
let cachedAt = 0;
let inflight: Promise<number> | null = null;
const TTL = 5 * 60_000;

async function fetchLatest(force = false): Promise<number> {
  const now = Date.now();
  if (!force && cachedAt && now - cachedAt < TTL) return cachedLatest;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await (supabase as any).rpc("latest_activity_at");
    cachedLatest = data ? new Date(data as string).getTime() : 0;
    cachedAt = Date.now();
    inflight = null;
    return cachedLatest;
  })();
  return inflight;
}

export function useHasUnreadNotifications(): boolean {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async (force = false) => {
      try {
        const latest = await fetchLatest(force);
        if (!mounted) return;
        setUnread(latest > 0 && latest > getLastSeen());
      } catch {
        if (mounted) setUnread(false);
      }
    };
    check();
    const onChange = () => check(true);
    window.addEventListener("aladhra:notif", onChange);
    const interval = window.setInterval(() => check(true), 5 * 60_000);
    return () => {
      mounted = false;
      window.removeEventListener("aladhra:notif", onChange);
      clearInterval(interval);
    };
  }, []);

  return unread;
}

