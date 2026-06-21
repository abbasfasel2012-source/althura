import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "aladhra.theme";

type Ctx = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
};
const ThemeCtx = createContext<Ctx | null>(null);

function getSystem(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start with "system" so SSR markup matches the pre-hydration script default.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Read persisted choice after mount (avoids SSR/CSR mismatch — React #418).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (raw === "light" || raw === "dark" || raw === "system") {
        setThemeState(raw);
      }
    } catch { /* noop */ }
  }, []);

  // Compute & apply resolved theme.
  useEffect(() => {
    const r = theme === "system" ? getSystem() : theme;
    setResolved(r);
    applyClass(r);
  }, [theme]);

  // React to system changes while in "system" mode.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = mq.matches ? "dark" : "light";
      setResolved(r);
      applyClass(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// Inline script injected into <head> to apply theme BEFORE hydration.
// Prevents FOUC and the white-flash on dark-mode users.
export const themeBootstrapScript = `
(function(){try{
  var t = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
  if(t){ try{ t = JSON.parse(t); }catch(e){} }
  var sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  var r = (t === 'light' || t === 'dark') ? t : sys;
  var el = document.documentElement;
  if(r === 'dark') el.classList.add('dark'); else el.classList.remove('dark');
  el.style.colorScheme = r;
}catch(e){}})();
`;
