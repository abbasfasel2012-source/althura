import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useLocalStorage } from "@/lib/store";
import { useTheme, type Theme } from "@/lib/theme";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { Bell, BellRing, Globe, Languages, Monitor, Moon, Sun, Vibrate, Volume2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { enableDeviceNotifications, getPushPermission, type PushPermission } from "@/lib/push";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الإعدادات" },
      { name: "description", content: "إعدادات التطبيق والإشعارات والمظهر واللغة." },
      { property: "og:title", content: "الذرى الذكية | الإعدادات" },
      { property: "og:description", content: "إعدادات التطبيق والإشعارات والمظهر واللغة." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [notif, setNotif] = useLocalStorage("aladhra.notif", true);
  const [sound, setSound] = useLocalStorage("aladhra.sound", true);
  const [vibrate, setVibrate] = useLocalStorage("aladhra.vibrate", false);
  const [perm, setPerm] = useState<PushPermission>("default");

  useEffect(() => { setPerm(getPushPermission()); }, []);

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("settings.light"), icon: Sun },
    { value: "dark", label: t("settings.dark"), icon: Moon },
    { value: "system", label: t("settings.system"), icon: Monitor },
  ];

  return (
    <AppShell title={t("settings.title")}>
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          {t("settings.eyebrow")}
        </div>
        <h1 className="text-2xl font-bold">{t("settings.heading")}</h1>
      </div>

      <SectionTitle eyebrow={t("settings.appearance")} title={t("settings.theme")} />
      <Card className="!p-2 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`rounded-xl p-3 flex flex-col items-center gap-2 transition active:scale-95 ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <SectionTitle eyebrow={t("settings.langEyebrow")} title={t("settings.language")} />
      <Card className="!p-2 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => {
            const active = lang === l.value;
            return (
              <button
                key={l.value}
                onClick={() => setLang(l.value as Lang)}
                className={`rounded-xl p-3 flex flex-col items-center gap-2 transition active:scale-95 ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Languages className="size-5" />
                <span className="text-xs font-bold">{l.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <SectionTitle eyebrow={t("settings.alerts")} title={t("settings.notifications")} />
      <div className="space-y-2 mb-5">
        <Toggle icon={<Bell className="size-4" />} label={t("settings.adminNotif")} value={notif} onChange={setNotif} />
        <div className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <span className="text-primary"><BellRing className="size-4" /></span>
          <span className="font-bold text-sm flex-1 text-start">{t("settings.device")}</span>
          {perm === "granted" ? (
            <span className="text-[11px] font-bold text-accent">{t("settings.deviceOn")}</span>
          ) : perm === "denied" ? (
            <span className="text-[11px] text-muted-foreground">{t("settings.deviceDenied")}</span>
          ) : perm === "unsupported" ? (
            <span className="text-[11px] text-muted-foreground">{t("settings.deviceUnsupported")}</span>
          ) : (
            <button
              onClick={async () => setPerm(await enableDeviceNotifications())}
              className="text-[11px] font-bold rounded-full px-3 py-1.5 bg-primary text-primary-foreground active:scale-95 transition"
            >
              {t("settings.deviceEnable")}
            </button>
          )}
        </div>
        <Toggle icon={<Volume2 className="size-4" />} label={t("settings.sound")} value={sound} onChange={setSound} />
        <Toggle icon={<Vibrate className="size-4" />} label={t("settings.vibrate")} value={vibrate} onChange={setVibrate} />
      </div>

      <Card className="!p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <WifiOff className="size-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">{t("settings.offline")}</div>
            <div className="text-[11px] text-muted-foreground">{t("settings.offlineHint")}</div>
          </div>
        </div>
      </Card>

      <SectionTitle eyebrow={t("settings.aboutEyebrow")} title={t("settings.about")} />
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Globe className="size-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">{t("settings.appTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("settings.version")}</div>
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
      className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.99]"
    >
      <span className="text-primary">{icon}</span>
      <span className="font-bold text-sm flex-1 text-start">{label}</span>
      <span
        className={`relative w-10 h-6 rounded-full transition ${value ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
            value ? "end-0.5" : "start-0.5"
          }`}
        />
      </span>
    </button>
  );
}
