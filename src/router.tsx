import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    // شبكات الطلاب بالعراق مو دايماً مستقرة — بدون هذا، أي طلب فاشل كان
    // يترك سكيلتون عالق بصمت بدون أي تفسير للمستخدم (يحس التطبيق "معلّق"
    // أو "مو ثابت"). الحين أي فشل شبكة حقيقي يطلع toast واضح بدل الصمت.
    // نتجاهل أخطاء المصادقة (401/جلسة منتهية) لأنها تُعالج بمكان ثاني
    // (تحويل لصفحة الدخول)، ونتجاهل الأخطاء أثناء عدم الاتصال أصلاً
    // (already shown by the offline banner).
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        const msg = error instanceof Error ? error.message : "";
        if (/JWT|401|Unauthorized|not allowed/i.test(msg)) return;
        toast.error("صار خطأ بتحميل البيانات", { description: "جرّب تحدّث الصفحة" });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          toast.error("لا يوجد اتصال بالإنترنت", { description: "حاول مرة ثانية بعد الاتصال" });
          return;
        }
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
    // لما الصفحة تكون محمّلة مسبقاً (preload="intent")، التنقل يصير فوري 0ms —
    // وبدون أي انتقال يحس المستخدم بقطع مفاجئ/كرنج بين الصفحات. الـ View
    // Transitions API تعطي تلاشي سلس تلقائياً بين اللقطتين (Chrome/Edge/Safari
    // الحديثة، وتتجاهل بهدوء بالمتصفحات القديمة بدون أي كسر).
    defaultViewTransition: true,
  });

  return router;
};
