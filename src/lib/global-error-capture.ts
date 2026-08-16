// React's error boundary only catches render-phase errors. Anything thrown
// inside an event handler, a setTimeout, or an async callback that isn't
// awaited/try-caught slips past it silently — the button just "does
// nothing", which is exactly the kind of thing that makes an app feel
// unstable compared to something like Facebook (which always shows *some*
// feedback). This wires up the two window-level catch-alls and gives the
// user a lightweight toast instead of dead silence, rate-limited so a loop
// of errors doesn't spam the screen.
import { toast } from "sonner";
import { reportLovableError } from "./lovable-error-reporting";

let started = false;
let lastToastAt = 0;
const TOAST_COOLDOWN_MS = 8000;
const bootedAt = typeof performance !== "undefined" ? performance.now() : 0;

// أخطاء متصفح معروفة أنها غير ضارة تماماً وتصير بشكل طبيعي مع أي تخطيط
// متحرك/عناصر زجاجية (زي هذا الموقع) — لو ما فلترناها، تطلع بتوست مخيف
// "صار خطأ" رغم إن التطبيق شغّال 100% بدون أي مشكلة فعلية. هذا بالضبط
// سبب "التحذير اللي يطلع ويختفي بسرعة" اللي لاحظه عباس بصفحات مختلفة.
const BENIGN_PATTERNS = [
  /ResizeObserver loop/i,
  /Script error\.?$/i, // cross-origin script errors with no real detail
  /Non-Error promise rejection captured/i,
  /AbortError/i,
  /Load failed/i, // Safari's generic fetch-abort-on-navigation message
];

function isBenign(text: string) {
  return BENIGN_PATTERNS.some((re) => re.test(text));
}

function notifyOnce() {
  // أول ٣ ثواني من التحميل: تخطيط الصفحة لسا يستقر (رسوم/blur/تحريك)،
  // احتمال تحذيرات متصفح عابرة أعلى هنا تحديداً.
  if (typeof performance !== "undefined" && performance.now() - bootedAt < 3000) return;
  const now = Date.now();
  if (now - lastToastAt < TOAST_COOLDOWN_MS) return;
  lastToastAt = now;
  toast.error("صار خطأ غير متوقع", { description: "جرّب مرة ثانية، ولو تكرر حدّث الصفحة" });
}

export function setupGlobalErrorCapture() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("error", (event) => {
    const error = event.error ?? event.message;
    const text = error instanceof Error ? error.message : String(error ?? "");
    if (isBenign(text)) return;
    reportLovableError(error, { mechanism: "onerror" });
    notifyOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    const text = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
    if (isBenign(text)) return;
    reportLovableError(event.reason, { mechanism: "unhandledrejection" });
    notifyOnce();
  });
}
