import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en" | "fr";

export const LANGS: { value: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { value: "ar", label: "العربية", dir: "rtl" },
  { value: "en", label: "English", dir: "ltr" },
  { value: "fr", label: "Français", dir: "ltr" },
];

type Dict = Record<string, string>;

const ar: Dict = {
  "push.announcement": "تبليغ جديد",
  "push.news": "خبر جديد",
  "push.event": "فعالية جديدة",
  "push.exam": "اختبار جديد",
  "push.dm": "رسالة جديدة",
  "settings.device": "إشعارات الجهاز",
  "settings.deviceOn": "مُفعّلة",
  "settings.deviceEnable": "تفعيل",
  "settings.deviceDenied": "مرفوضة من المتصفح",
  "settings.deviceUnsupported": "غير مدعومة",
  "settings.offline": "العمل دون إنترنت",
  "settings.offlineHint": "يُحفظ التطبيق للعمل بلا اتصال بعد النشر.",
  "home.welcomeGuest": "أهلاً بك في",
  "home.brand": "الذرى",
  "home.ownerPanel": "لوحة",
  "home.owner": "المالك",
  "home.hi": "أهلاً،",
  "home.guestSub": "تتصفّح كضيف — يظهر لك المحتوى العام فقط.",
  "home.ownerSub": "إدارة المنصة، الطلبة، والتبليغات من مكان واحد.",
  "home.studentSub": "لديك مسار تعليمي حافل اليوم. ركّز، واستمتع.",
  "home.manage": "إدارة",
  "home.openAdmin": "فتح لوحة التحكم",
  "home.homework": "الواجبات",
  "home.exams": "الامتحانات",
  "home.latestAnn": "آخر تبليغ",
  "home.noAnn": "لا توجد تبليغات",
  "home.library": "المكتبة",
  "home.news": "الأخبار",
  "home.newsSub": "آخر مستجدات",
  "home.events": "الفعاليات",
  "home.eventsSub": "القادمة",
  "home.contact": "تواصل",
  "home.contactSub": "مع الإدارة",
  "home.signupCta": "سجّل حساب طالب للوصول الكامل",
  "home.todaySchedule": "جدول اليوم",
  "home.noSchedule": "لا يوجد جدول اليوم",
  "home.noScheduleHint": "تواصل مع الإدارة لإضافة الجدول",
  "home.today": "اليوم",
  "home.notAdded": "— لم يُضف بعد —",
  "home.aiTitle": "مساعد عبوسي",
  "home.aiSub": "اسألني عن أي درس أو واجب.",
  "home.aiCta": "ابدأ المحادثة",
  "home.alert": "تنبيه",
  "home.noAnnShort": "لا تبليغات",
  "home.quizzes": "اختبارات",
  "home.open": "فتح",
  "home.grades": "الدرجات",
  "home.view": "عرض",
  "home.latestHomework": "آخر الواجبات",
  "common.guest": "زائر",
  "home.librarySub": "كتب وفيديوهات",
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
  "push.announcement": "New announcement",
  "push.news": "New article",
  "push.event": "New event",
  "push.exam": "New exam",
  "push.dm": "New message",
  "settings.device": "Device notifications",
  "settings.deviceOn": "Enabled",
  "settings.deviceEnable": "Enable",
  "settings.deviceDenied": "Blocked by browser",
  "settings.deviceUnsupported": "Not supported",
  "settings.offline": "Offline mode",
  "settings.offlineHint": "The app is cached for offline use after publishing.",
  "home.welcomeGuest": "Welcome to",
  "home.brand": "Al-Dhura",
  "home.ownerPanel": "Owner",
  "home.owner": "panel",
  "home.hi": "Hello,",
  "home.guestSub": "Browsing as a guest — public content only.",
  "home.ownerSub": "Manage the platform, students and announcements in one place.",
  "home.studentSub": "You have a full learning day ahead. Stay focused.",
  "home.manage": "Admin",
  "home.openAdmin": "Open dashboard",
  "home.homework": "Homework",
  "home.exams": "Exams",
  "home.latestAnn": "Latest announcement",
  "home.noAnn": "No announcements",
  "home.library": "Library",
  "home.librarySub": "Books & videos",
  "home.news": "News",
  "home.newsSub": "Latest updates",
  "home.events": "Events",
  "home.eventsSub": "Upcoming",
  "home.contact": "Contact",
  "home.contactSub": "With the administration",
  "home.signupCta": "Create a student account for full access",
  "home.todaySchedule": "Today's schedule",
  "home.noSchedule": "No classes today",
  "home.noScheduleHint": "Contact the administration to add the schedule",
  "home.today": "Today",
  "home.notAdded": "— not added yet —",
  "home.aiTitle": "Abousy assistant",
  "home.aiSub": "Ask me about any lesson or homework.",
  "home.aiCta": "Start chatting",
  "home.alert": "Alert",
  "home.noAnnShort": "No alerts",
  "home.quizzes": "Quizzes",
  "home.open": "Open",
  "home.grades": "Grades",
  "home.view": "View",
  "home.latestHomework": "Latest homework",
  "common.guest": "Guest",
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
  "push.announcement": "Nouvelle annonce",
  "push.news": "Nouvel article",
  "push.event": "Nouvel événement",
  "push.exam": "Nouvel examen",
  "push.dm": "Nouveau message",
  "settings.device": "Notifications de l'appareil",
  "settings.deviceOn": "Activées",
  "settings.deviceEnable": "Activer",
  "settings.deviceDenied": "Bloquées par le navigateur",
  "settings.deviceUnsupported": "Non prises en charge",
  "settings.offline": "Mode hors ligne",
  "settings.offlineHint": "L'application est mise en cache pour un usage hors ligne après publication.",
  "home.welcomeGuest": "Bienvenue à",
  "home.brand": "Al-Dhura",
  "home.ownerPanel": "Panneau",
  "home.owner": "propriétaire",
  "home.hi": "Bonjour,",
  "home.guestSub": "Navigation en tant qu'invité — contenu public uniquement.",
  "home.ownerSub": "Gérez la plateforme, les élèves et les annonces au même endroit.",
  "home.studentSub": "Une belle journée d'apprentissage vous attend.",
  "home.manage": "Administration",
  "home.openAdmin": "Ouvrir le tableau de bord",
  "home.homework": "Devoirs",
  "home.exams": "Examens",
  "home.latestAnn": "Dernière annonce",
  "home.noAnn": "Aucune annonce",
  "home.library": "Bibliothèque",
  "home.librarySub": "Livres et vidéos",
  "home.news": "Actualités",
  "home.newsSub": "Dernières nouvelles",
  "home.events": "Événements",
  "home.eventsSub": "À venir",
  "home.contact": "Contact",
  "home.contactSub": "Avec l'administration",
  "home.signupCta": "Créez un compte élève pour un accès complet",
  "home.todaySchedule": "Emploi du jour",
  "home.noSchedule": "Aucun cours aujourd'hui",
  "home.noScheduleHint": "Contactez l'administration pour ajouter l'emploi du temps",
  "home.today": "Aujourd'hui",
  "home.notAdded": "— pas encore ajouté —",
  "home.aiTitle": "Assistant Abousy",
  "home.aiSub": "Posez-moi une question sur un cours ou un devoir.",
  "home.aiCta": "Commencer",
  "home.alert": "Alerte",
  "home.noAnnShort": "Aucune alerte",
  "home.quizzes": "Quiz",
  "home.open": "Ouvrir",
  "home.grades": "Notes",
  "home.view": "Voir",
  "home.latestHomework": "Derniers devoirs",
  "common.guest": "Invité",
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
