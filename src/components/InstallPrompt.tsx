import { useEffect, useState } from "react";
import { Download, Share, X, Plus } from "lucide-react";

const DISMISS_KEY = "aladhra.install.dismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires beforeinstallprompt — show the manual instructions instead.
    let timer = 0;
    if (isIOS()) {
      timer = window.setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 2500);
    }

    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[60] animate-pop">
      <div className="glass-strong rounded-2xl p-3.5 shadow-glass flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold">
          ذ
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">ثبّت تطبيق الذرى على هاتفك</div>
          {iosHint ? (
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-6">
              اضغط <Share className="inline size-3.5 align--2" /> مشاركة ثم{" "}
              <Plus className="inline size-3.5 align--2" /> «إضافة إلى الشاشة الرئيسية».
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-6">
              فتح أسرع، أيقونة على الشاشة الرئيسية، ويعمل حتى بدون إنترنت.
            </p>
          )}
          {!iosHint && (
            <button
              onClick={install}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-[13px] font-bold press"
            >
              <Download className="size-4" /> تثبيت الآن
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="size-8 shrink-0 grid place-items-center rounded-lg text-muted-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
