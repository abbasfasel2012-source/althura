import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider, themeBootstrapScript } from "../lib/theme";
import { LanguageProvider } from "../lib/i18n";
import { LiveNotifications } from "../lib/push";
import { setupOffline } from "../lib/pwa";
import { getQueryPersistOptions } from "../lib/query-persist";
import { InstallPrompt } from "../components/InstallPrompt";
import { Toaster } from "../components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي تبحث عنها مو موجودة أو انتقلت لمكان ثاني.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:opacity-90"
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 size-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          الصفحة ما انفتحت
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          صار خطأ غير متوقع. جرّب تحدّث الصفحة أو ارجع للرئيسية — لو تكرر
          الخطأ، خبر عباس.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:opacity-90"
          >
            حاول مرة ثانية
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-2/60 px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-surface-2"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ثانوية الذرى الذكية للمتميزين | كربلاء المقدسة" },
      { name: "description", content: "منصة طلابية متكاملة لثانوية الذرى الذكية للمتميزين — جداول، امتحانات، واجبات، تبليغات، ومساعد ذكي. تم اعدادها بواسطة عباس فاضل وليس لادارة المدرسة علاقة بها" },
      { name: "author", content: "ثانوية الذرى الذكية" },
      { property: "og:title", content: "ثانوية الذرى الذكية للمتميزين | كربلاء المقدسة" },
      { property: "og:description", content: "منصة طلابية متكاملة لثانوية الذرى الذكية للمتميزين — جداول، امتحانات، واجبات، تبليغات، ومساعد ذكي. تم اعدادها بواسطة عباس فاضل وليس لادارة المدرسة علاقة بها" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ثانوية الذرى الذكية للمتميزين | كربلاء المقدسة" },
      { name: "twitter:description", content: "منصة طلابية متكاملة لثانوية الذرى الذكية للمتميزين — جداول، امتحانات، واجبات، تبليغات، ومساعد ذكي. تم اعدادها بواسطة عباس فاضل وليس لادارة المدرسة علاقة بها" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/7jS9CamGVmNYX1rwZi7SC4S92ly2/social-images/social-1781327614662-1000270650.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/7jS9CamGVmNYX1rwZi7SC4S92ly2/social-images/social-1781327614662-1000270650.webp" },
    ],
    links: [
      // preload الأصول الحرجة (CSS الرئيسي + خط الموقع) عشان تبدأ تنزل مباشرة
      // مع الـ HTML بدل ما تنتظر اكتشافها بمنتصف تحليل الصفحة — هذا يقلل
      // الفرق الزمني بين ظهور الهيكل والمحتوى الفعلي (شريط التحميل → سكيلتون → محتوى).
      { rel: "preload", href: appCss, as: "style" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],

  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // The inline theme script mutates <html> (class + color-scheme) before
    // hydration, so React must be told not to diff those attributes —
    // otherwise it logs a hydration mismatch and re-renders the whole tree.
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Stable across renders (persister must not be recreated every render,
  // or PersistQueryClientProvider re-restores on each one).
  const persistOptions = useMemo(() => getQueryPersistOptions(), []);

  useEffect(() => {
    setupOffline();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <LanguageProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <LiveNotifications />
          <InstallPrompt />
          <Toaster position="top-center" />
        </LanguageProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

