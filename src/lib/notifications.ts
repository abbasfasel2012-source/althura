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

async function fetchLatest(): Promise<number> {
  const tables = ["announcements", "news", "events"] as const;
  const results = await Promise.all(
    tables.map((t) =>
      supabase.from(t).select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle()
    )
  );
  let max = 0;
  for (const r of results) {
    const ts = r.data?.created_at ? new Date(r.data.created_at as string).getTime() : 0;
    if (ts > max) max = ts;
  }
  return max;
}

export function useHasUnreadNotifications(): boolean {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const latest = await fetchLatest();
        if (!mounted) return;
        setUnread(latest > 0 && latest > getLastSeen());
      } catch {
        if (mounted) setUnread(false);
      }
    };
    check();
    const onChange = () => check();
    window.addEventListener("aladhra:notif", onChange);
    const interval = window.setInterval(check, 60000);
    return () => {
      mounted = false;
      window.removeEventListener("aladhra:notif", onChange);
      clearInterval(interval);
    };
  }, []);

  return unread;
}
