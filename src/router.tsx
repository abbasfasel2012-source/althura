import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { getCachedAuthState } from "./lib/auth";

const bootedAt = typeof performance !== "undefined" ? performance.now() : 0;

function shouldSuppressErrorToast(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;

  // أول ٣ ثواني من فتح التطبيق: الجلسة والكاش المستعاد لسا يتهيّأون —
  // أي استعلام يفشل بهذي الفترة غالباً مؤقت ومتوقع (مثلاً صفحة تسجيل
  // الدخول قبل ما تتأكد الجلسة)، مو خطأ حقيقي يستاهل تنبيه المستخدم.
  if (typeof performance !== "undefined" && performance.now() - bootedAt < 3000) return true;

  // أغلب الاستعلامات بالتطبيق تحتاج تسجيل دخول — فشلها وقت عدم وجود
  // جلسة (أو أثناء تسجيل الخروج) متوقع تماماً وليس خطأ حقيقي.
  const auth = getCachedAuthState();
  if (auth.loading || !auth.userId) return true;

  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (/JWT|401|Unauthorized|not allowed|permission denied|row-level security|PGRST/i.test(msg)) return true;

  return false;
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    // شبكات الطلاب بالعراق مو دايماً مستقرة — بدون هذا، أي طلب فاشل كان
    // يترك سكيلتون عالق بصمت بدون أي تفسير للمستخدم (يحس التطبيق "معلّق"
    // أو "مو ثابت"). الحين أي فشل شبكة حقيقي (لمستخدم مسجّل دخول، بعد
    // التهيئة الأولى) يطلع toast واضح بدل الصمت.
    queryCache: new QueryCache({
      onError: (error) => {
        if (shouldSuppressErrorToast(error)) return;
        toast.error("صار خطأ بتحميل البيانات", { description: "جرّب تحدّث الصفحة" });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          toast.error("لا يوجد اتصال بالإنترنت", { description: "حاول مرة ثانية بعد الاتصال" });
          return;
        }
        if (shouldSuppressErrorToast(error)) return;
        const msg = error instanceof Error ? error.message : "صار خطأ غير متوقع";
        toast.error(msg);
      },
    }),
    defaultOptions: {
      queries: {
        // Cached pages must paint instantly when the user comes back to them;
        // a refetch on every mount was what made navigation feel sticky.
        staleTime: 60_000,
        gcTime: 24 * 60 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: 1,
        // Keep the previous result on screen while a new one loads instead of
        // flashing a skeleton on every parameter change.
        placeholderData: (prev: unknown) => prev,
        networkMode: "offlineFirst",
      },
    },
  });



  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    defaultPreloadStaleTime: 30_000,
    // View Transitions سبّبت أكثر من مشكلة بصرية متكررة بعد عدة محاولات
    // إصلاح — أوقفتها نهائياً. انتقال مباشر بدون أي تأثير أثبت وأبسط.
  });

  return router;
};
