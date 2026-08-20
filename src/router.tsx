import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { getCachedAuthState } from "./lib/auth";
import { getErrorMessage } from "./lib/utils";

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

  const msg = getErrorMessage(error, "");
  if (/JWT|401|Unauthorized|not allowed|permission denied|row-level security|PGRST/i.test(msg)) return true;

  return false;
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    // شبكات الطلاب بالعراق مو دايماً مستقرة — بدون هذا، أي طلب فاشل كان
    // يترك سكيلتون عالق بصمت بدون أي تفسير للمستخدم (يحس التطبيق "معلّق"
    // أو "مو ثابت"). الحين أي فشل شبكة حقيقي (لمستخدم مسجّل دخول، بعد
    // التهيئة الأولى) يطلع toast واضح بدل الصمت — ويتضمّن السبب الفعلي
    // مو بس رسالة عامة، عشان يصير التشخيص أسهل.
    queryCache: new QueryCache({
      onError: (error) => {
        if (shouldSuppressErrorToast(error)) return;
        toast.error("صار خطأ بتحميل البيانات", { description: getErrorMessage(error) });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          toast.error("لا يوجد اتصال بالإنترنت", { description: "حاول مرة ثانية بعد الاتصال" });
          return;
        }
        if (shouldSuppressErrorToast(error)) return;
        toast.error(getErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        // Cached pages must paint instantly when the user comes back to them;
        // a refetch on every mount was what made navigation feel sticky.
        staleTime: 60_000,
        // ⚠️ كانت 24 ساعة — يعني كل استعلام تسويه بالجلسة (رسائل كل كروب
        // فتحته، كل محادثة خاصة، كل صفحة فيديو...) يضل بالذاكرة كامل يوم،
        // يتراكم بلا حدود بجلسة استخدام طويلة ويسبب بطء تدريجي وربما
        // كرش على أجهزة بذاكرة محدودة. ١٠ دقائق كافية لإحساس "فوري" عند
        // التنقل جيئة وذهاباً بجلسة عادية، وبعدها تتحرر البيانات المهجورة.
        // هذا لا يأثر على الكاش المحفوظ بالتخزين المحلي (يرجع فوراً بفتح
        // التطبيق من جديد بغض النظر عن هذا الرقم).
        gcTime: 10 * 60_000,
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
    // رجّعتها بطلب عباس (يحس التلاشي بين الصفحات "أجمل"). المرة الماضية
    // سبّبت مشاكل، بس وقتها كانت مبنّدلة مع تغييرات ثانية بنفس الكومت
    // (query gating لصفحات كثيرة دفعة وحدة) صعب تشخيص أيهم المسبب —
    // فهذي المرة بكومت منفصل تماماً، والـ CSS المستخدم هنا (بـ styles.css)
    // هو نفس الإصلاح المجرّب سابقاً (تلاشي opacity بسيط، مو blend-mode
    // الافتراضي اللي كان يعطي توهج مزعج). إذا صارت مشكلة، نرجعها فوراً.
    defaultViewTransition: true,
  });

  return router;
};
