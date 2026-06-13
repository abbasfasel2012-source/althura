import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useLocalStorage } from "@/lib/store";
import { Bell, Globe, Moon, Sun, Vibrate, Volume2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الإعدادات" },
      { name: "description", content: "إعدادات التطبيق والإشعارات والمظهر." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("aladhra.theme", "light");
  const [notif, setNotif] = useLocalStorage("aladhra.notif", true);
  const [sound, setSound] = useLocalStorage("aladhra.sound", true);
  const [vibrate, setVibrate] = useLocalStorage("aladhra.vibrate", false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return (
    <AppShell title="الإعدادات">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          تخصيص
        </div>
        <h1 className="text-2xl font-bold">إعدادات التطبيق</h1>
      </div>

      <SectionTitle eyebrow="المظهر" title="السمة" />
      <Card className="!p-2 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`rounded-xl p-3 flex flex-col items-center gap-2 transition ${
              theme === "light" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            <Sun className="size-5" />
            <span className="text-xs font-bold">فاتح</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`rounded-xl p-3 flex flex-col items-center gap-2 transition ${
              theme === "dark" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            <Moon className="size-5" />
            <span className="text-xs font-bold">داكن</span>
          </button>
        </div>
      </Card>

      <SectionTitle eyebrow="التنبيهات" title="الإشعارات" />
      <div className="space-y-2 mb-5">
        <Toggle icon={<Bell className="size-4" />} label="إشعارات الإدارة" value={notif} onChange={setNotif} />
        <Toggle icon={<Volume2 className="size-4" />} label="الصوت" value={sound} onChange={setSound} />
        <Toggle icon={<Vibrate className="size-4" />} label="الاهتزاز" value={vibrate} onChange={setVibrate} />
      </div>

      <SectionTitle eyebrow="عن التطبيق" title="معلومات" />
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Globe className="size-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">منصة الذرى الذكية</div>
            <div className="text-[11px] text-muted-foreground">الإصدار ١.٠ — كربلاء المقدسة</div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

function Toggle({
  icon, label, value, onChange,
}: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3"
    >
      <span className="text-primary">{icon}</span>
      <span className="font-bold text-sm flex-1 text-right">{label}</span>
      <span
        className={`relative w-10 h-6 rounded-full transition ${value ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
            value ? "right-0.5" : "right-[1.125rem]"
          }`}
        />
      </span>
    </button>
  );
}
