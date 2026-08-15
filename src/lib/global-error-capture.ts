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

function notifyOnce() {
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
    reportLovableError(error, { mechanism: "onerror" });
    notifyOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportLovableError(event.reason, { mechanism: "unhandledrejection" });
    notifyOnce();
  });
}
