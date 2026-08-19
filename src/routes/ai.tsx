import { createFileRoute } from "@tanstack/react-router";

// المكوّن الفعلي بملف ai.lazy.tsx عمداً — صفحة عبوسي تجرّ مكتبة الـ
// AI SDK وReactMarkdown وremark-gfm (تقريباً 100 كيلوبايت مضغوطة)،
// وبدون هذا الفصل كانت هذي المكتبات تنحمّل بكل صفحة بالتطبيق حتى لو
// المستخدم أبداً ما فتح عبوسي. اتفاقية .lazy.tsx بـ TanStack Router
// تخلي Vite يفصلها بجزء منفصل يتحمّل بس عند زيارة هذي الصفحة تحديداً.
export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | مساعد عبوسي" },
      { name: "description", content: "مساعد ذكي يساعدك في دروسك وواجباتك." },
      { property: "og:title", content: "الذرى الذكية | مساعد عبوسي" },
      { property: "og:description", content: "مساعد ذكي يساعدك في دروسك وواجباتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
