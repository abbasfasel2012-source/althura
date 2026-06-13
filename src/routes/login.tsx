import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setUser, GRADE_NAMES, type Grade, type Section } from "@/lib/store";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تسجيل الدخول" },
      { name: "description", content: "سجّل دخولك إلى منصة ثانوية الذرى الذكية للمتميزين." },
    ],
  }),
  component: LoginPage,
});

type Tab = "login" | "guest" | "owner";

// كلمة مرور المالك (محلية فقط، للعرض). عند ربط Lovable Cloud ستصبح مصادقة حقيقية.
const OWNER_PASSWORD = "aldhura2026";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<Grade>("6");
  const [section, setSection] = useState<Section>("أ");
  const [ownerPass, setOwnerPass] = useState("");
  const [ownerErr, setOwnerErr] = useState("");

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <div className="flex items-center gap-3 mb-8 animate-reveal">
        <div className="size-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center font-bold text-xl shadow-glass">
          ذ
        </div>
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase">كربلاء المقدسة</div>
          <div className="text-base font-bold">ثانوية الذرى الذكية للمتميزين</div>
        </div>
      </div>

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

      <div className="mt-8 glass-strong rounded-2xl p-1.5 grid grid-cols-3 gap-1 animate-reveal [animation-delay:140ms]">
        {(
          [
            ["login", "طالب"],
            ["guest", "ضيف"],
            ["owner", "مالك"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            {id === "owner" && <Shield className="size-3.5" />}
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 glass-strong rounded-3xl p-5 shadow-soft animate-reveal [animation-delay:200ms]">
        {tab === "guest" && (
          <div className="text-center py-2">
            <div className="text-base font-bold mb-1">دخول كزائر</div>
            <p className="text-xs text-muted-foreground mb-5">
              تصفّح فقط المحتوى العام: التبليغات، الأخبار، الفعاليات، والكتب. لن تظهر بيانات شخصية.
            </p>
            <button
              onClick={() => {
                setUser({ fullName: "زائر", grade: "general", role: "guest" });
                navigate({ to: "/" });
              }}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
            >
              تصفّح كضيف
            </button>
          </div>
        )}

        {tab === "owner" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ownerPass !== OWNER_PASSWORD) {
                setOwnerErr("كلمة المرور غير صحيحة");
                return;
              }
              setUser({ fullName: "مالك المنصة", grade: "general", role: "owner" });
              navigate({ to: "/admin" });
            }}
            className="space-y-3"
          >
            <div className="text-center mb-2">
              <Shield className="size-8 text-primary mx-auto mb-2" />
              <div className="text-base font-bold">دخول المالك</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                للإدارة فقط — الوصول إلى لوحة التحكم.
              </p>
            </div>
            <input
              type="password"
              value={ownerPass}
              onChange={(e) => { setOwnerPass(e.target.value); setOwnerErr(""); }}
              required
              placeholder="كلمة مرور المالك"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center font-mono"
            />
            {ownerErr && (
              <div className="text-[11px] text-destructive text-center font-bold">{ownerErr}</div>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm"
            >
              دخول لوحة التحكم
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              كلمة المرور الافتراضية:{" "}
              <span className="font-mono font-bold text-primary">aldhura2026</span>
              <br />
              (يمكن تغييرها لاحقاً عند تفعيل قاعدة البيانات)
            </p>
          </form>
        )}

        {tab === "login" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setUser({
                fullName: fullName || "طالب الذرى",
                grade,
                section,
                role: "student",
              });
              navigate({ to: "/" });
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
              تسجيل الدخول
            </button>
          </form>
        )}
      </div>

      <div className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
        تم إعداد المنصة بحب • كربلاء المقدسة
      </div>
    </div>
  );
}
