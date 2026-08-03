import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en" | "fr";

export const LANGS: { value: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { value: "ar", label: "العربية", dir: "rtl" },
  { value: "en", label: "English", dir: "ltr" },
  { value: "fr", label: "Français", dir: "ltr" },
];

type Dict = Record<string, string>;

const ar: Dict = {
  "nav.home": "الرئيسية",
  "nav.schedule": "الجدول",
  "nav.ai": "عبوسي",
  "nav.library": "المكتبة",
  "nav.profile": "حسابي",
  "app.name": "الذرى الذكية",
  "a11y.search": "بحث",
  "a11y.notifications": "الإشعارات",
  "a11y.logout": "خروج",
  "a11y.light": "تفعيل الوضع الفاتح",
  "a11y.dark": "تفعيل الوضع الداكن",
  "settings.title": "الإعدادات",
  "settings.eyebrow": "تخصيص",
  "settings.heading": "إعدادات التطبيق",
  "settings.appearance": "المظهر",
  "settings.theme": "السمة",
  "settings.light": "فاتح",
  "settings.dark": "داكن",
  "settings.system": "النظام",
  "settings.langEyebrow": "اللغة",
  "settings.language": "لغة الواجهة",
  "settings.alerts": "التنبيهات",
  "settings.notifications": "الإشعارات",
  "settings.adminNotif": "إشعارات الإدارة",
  "settings.sound": "الصوت",
  "settings.vibrate": "الاهتزاز",
  "settings.aboutEyebrow": "عن التطبيق",
  "settings.about": "معلومات",
  "settings.appTitle": "منصة الذرى الذكية",
  "settings.version": "الإصدار ١.٠ — كربلاء المقدسة",
  "chat.edit": "تعديل",
  "chat.delete": "حذف",
  "chat.copy": "نسخ",
  "chat.react": "تفاعل",
  "chat.cancel": "إلغاء",
  "chat.deleted": "— حُذفت الرسالة —",
  "chat.confirmDelete": "حذف الرسالة؟",
  "chat.actions": "خيارات الرسالة",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.schedule": "Schedule",
  "nav.ai": "Abousy",
  "nav.library": "Library",
  "nav.profile": "Profile",
  "app.name": "Al-Dhura Smart",
  "a11y.search": "Search",
  "a11y.notifications": "Notifications",
  "a11y.logout": "Sign out",
  "a11y.light": "Switch to light mode",
  "a11y.dark": "Switch to dark mode",
  "settings.title": "Settings",
  "settings.eyebrow": "Personalize",
  "settings.heading": "App settings",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.light": "Light",
  "settings.dark": "Dark",
  "settings.system": "System",
  "settings.langEyebrow": "Language",
  "settings.language": "Interface language",
  "settings.alerts": "Alerts",
  "settings.notifications": "Notifications",
  "settings.adminNotif": "Admin notifications",
  "settings.sound": "Sound",
  "settings.vibrate": "Vibration",
  "settings.aboutEyebrow": "About",
  "settings.about": "Information",
  "settings.appTitle": "Al-Dhura Smart Platform",
  "settings.version": "Version 1.0 — Karbala",
  "chat.edit": "Edit",
  "chat.delete": "Delete",
  "chat.copy": "Copy",
  "chat.react": "React",
  "chat.cancel": "Cancel",
  "chat.deleted": "— message deleted —",
  "chat.confirmDelete": "Delete this message?",
  "chat.actions": "Message actions",
};

const fr: Dict = {
  "nav.home": "Accueil",
  "nav.schedule": "Emploi du temps",
  "nav.ai": "Abousy",
  "nav.library": "Bibliothèque",
  "nav.profile": "Profil",
  "app.name": "Al-Dhura Smart",
  "a11y.search": "Recherche",
  "a11y.notifications": "Notifications",
  "a11y.logout": "Déconnexion",
  "a11y.light": "Passer en mode clair",
  "a11y.dark": "Passer en mode sombre",
  "settings.title": "Paramètres",
  "settings.eyebrow": "Personnalisation",
  "settings.heading": "Paramètres de l'application",
  "settings.appearance": "Apparence",
  "settings.theme": "Thème",
  "settings.light": "Clair",
  "settings.dark": "Sombre",
  "settings.system": "Système",
  "settings.langEyebrow": "Langue",
  "settings.language": "Langue de l'interface",
  "settings.alerts": "Alertes",
  "settings.notifications": "Notifications",
  "settings.adminNotif": "Notifications de l'administration",
  "settings.sound": "Son",
  "settings.vibrate": "Vibration",
  "settings.aboutEyebrow": "À propos",
  "settings.about": "Informations",
  "settings.appTitle": "Plateforme Al-Dhura Smart",
  "settings.version": "Version 1.0 — Kerbala",
  "chat.edit": "Modifier",
  "chat.delete": "Supprimer",
  "chat.copy": "Copier",
  "chat.react": "Réagir",
  "chat.cancel": "Annuler",
  "chat.deleted": "— message supprimé —",
  "chat.confirmDelete": "Supprimer ce message ?",
  "chat.actions": "Actions du message",
};

const DICTS: Record<Lang, Dict> = { ar, en, fr };

const STORAGE_KEY = "aladhra.lang";

interface Ctx {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<Ctx>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  t: (k) => ar[k] ?? k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && DICTS[stored]) setLangState(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const dir = LANGS.find((l) => l.value === lang)?.dir ?? "rtl";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang][key] ?? ar[key] ?? key,
    [lang],
  );

  const dir = LANGS.find((l) => l.value === lang)?.dir ?? "rtl";

  return (
    <LangContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useI18n() {
  return useContext(LangContext);
}
