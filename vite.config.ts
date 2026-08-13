// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false,
        // ⚠️ إصلاح جوهري: التصميم الأصلي (بدون outDir/globDirectory صريح)
        // كان يكتب sw.js إلى dist/ ويبحث عن الملفات ليعمل لها precache هناك
        // أيضاً — لكن هذا المشروع (TanStack Start + nitro) يخرج فعلياً إلى
        // .output/public. النتيجة: "precache 0 entries" بكل بناء (شفناها
        // بلوق البناء)، و sw.js نفسه ما كان حتى يوصل للمجلد المنشور فعلياً
        // — يعني تسجيل الـ Service Worker بالموقع الحي كان يفشل بصمت
        // (404 على /sw.js)، وبالتالي كل ميزات PWA (offline، precache،
        // تحميل فوري للصفحات المزارة) ما كانت تشتغل إطلاقاً بالإنتاج.
        outDir: ".output/public",
        workbox: {
          globDirectory: ".output/public",
          globPatterns: ["**/*.{js,css,woff2,png,svg,webmanifest,html}"],
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin && ["script", "style", "font", "image"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // Google Fonts files — never block the first paint on a cold network.
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              // Read-only backend data: serve last known copy instantly, refresh in background.
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                /\/rest\/v1\/|\/rest\/v1\/rpc\//.test(url.pathname) &&
                url.origin !== self.location.origin,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "api-reads",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
          ],
        },
      }),
    ],
  },
});
