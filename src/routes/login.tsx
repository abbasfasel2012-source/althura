import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setUser, GRADE_NAMES, type Grade, type Section } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تسجيل الدخول" },
      { name: "description", content: "سجّل دخولك إلى منصة ثانوية الذرى الذكية للمتميزين." },
    ],
  }),
  component: LoginPage,
});

type Tab = "login" | "register" | "guest";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<Grade>("6");
  const [section, setSection] = useState<Section>("أ");

  const submit = (role: "student" | "owner" | "guest") => {
    setUser({
      fullName: role === "guest" ? "زائر" : fullName || "طالب الذرى",
      grade,
      section,
      role,
    });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 animate-reveal">
        <div className="size-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center font-bold text-xl shadow-glass">
          ذ
        </div>
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase">كربلاء المقدسة</div>
          <div className="text-base font-bold">ثانوية الذرى الذكية للمتميزين</div>
        </div>
      </div>

      {/* Hero */}
      <div className="animate-reveal [animation-delay:80ms]">
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          منصة <span className="text-primary">الذرى</span>
          <br />
          <span className="text-accent">للتميّز الدراسي</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[28ch]">
          ادخل إلى عالم متكامل من الجداول، الامتحانات، التبليغات، ومساعد الذكاء الاصطناعي.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8 glass-strong rounded-2xl p-1.5 grid grid-cols-3 gap-1 animate-reveal [animation-delay:140ms]">
        {(
          [
            ["login", "دخول"],
            ["register", "تسجيل جديد"],
            ["guest", "ضيف"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              tab === id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="mt-5 glass-strong rounded-3xl p-5 shadow-soft animate-reveal [animation-delay:200ms]">
        {tab === "guest" ? (
          <div className="text-center py-2">
            <div className="text-base font-bold mb-1">دخول كزائر</div>
            <p className="text-xs text-muted-foreground mb-5">
              تصفّح المحتوى العام دون الحاجة لحساب.
            </p>
            <button
              onClick={() => submit("guest")}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
            >
              تصفّح كضيف
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const role =
                fullName.trim().toLowerCase() === "admin" ? "owner" : "student";
              submit(role);
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">
                الاسم الثلاثي
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="مثال: علي حسين كاظم"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">
                  الصف
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full px-3 py-3 rounded-xl bg-surface-2 border border-border text-sm"
                >
                  {(Object.keys(GRADE_NAMES) as Grade[]).map((g) => (
                    <option key={g} value={g}>
                      {GRADE_NAMES[g]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">
                  الشعبة
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as Section)}
                  className="w-full px-3 py-3 rounded-xl bg-surface-2 border border-border text-sm"
                >
                  {(["أ", "ب", "ج", "د"] as Section[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm mt-2"
            >
              {tab === "login" ? "تسجيل الدخول" : "إرسال الطلب"}
            </button>
            <p className="text-[11px] text-center text-muted-foreground">
              للمالك: اكتب{" "}
              <span className="font-mono font-bold text-primary">admin</span> في الاسم.
            </p>
          </form>
        )}
      </div>

      <div className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
        تم إعداد المنصة بحب • كربلاء المقدسة
      </div>
    </div>
  );
}
