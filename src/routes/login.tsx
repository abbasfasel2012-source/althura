import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setUser, GRADE_NAMES, type Grade, type Section } from "@/lib/store";
import {
  OWNER_EMAIL,
  signInOwner,
  signInStudent,
  signUpOwner,
  signUpStudent,
} from "@/lib/auth";
import { Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تسجيل الدخول" },
      { name: "description", content: "سجّل دخولك إلى منصة ثانوية الذرى الذكية للمتميزين." },
    ],
  }),
  component: LoginPage,
});

type Tab = "student" | "guest" | "owner";
type Mode = "in" | "up";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("student");
  const [mode, setMode] = useState<Mode>("in");

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<Grade>("6");
  const [section, setSection] = useState<Section>("أ");

  const [email, setEmail] = useState(OWNER_EMAIL);
  const [ownerPass, setOwnerPass] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submitStudent(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "in") {
        await signInStudent(studentId, password);
      } else {
        await signUpStudent({ studentId, password, fullName, grade, section });
      }
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(translate(e?.message));
    } finally {
      setBusy(false);
    }
  }

  async function submitOwner(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      try {
        await signInOwner(email, ownerPass);
      } catch (innerErr: any) {
        // If credentials are wrong AND user doesn't exist yet, try signup
        if (/invalid login|invalid credentials/i.test(innerErr?.message ?? "")) {
          await signUpOwner(email, ownerPass);
          // After sign up, sign in (autoConfirm is on)
          await signInOwner(email, ownerPass);
        } else {
          throw innerErr;
        }
      }
      navigate({ to: "/admin" });
    } catch (e: any) {
      setErr(translate(e?.message));
    } finally {
      setBusy(false);
    }
  }

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
      </div>

      <div className="mt-7 glass-strong rounded-2xl p-1.5 grid grid-cols-3 gap-1 animate-reveal [animation-delay:140ms]">
        {(
          [
            ["student", "طالب"],
            ["guest", "ضيف"],
            ["owner", "مالك"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setErr(""); }}
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
              تصفّح المحتوى العام فقط (تبليغات، أخبار، فعاليات). لن تظهر بيانات شخصية.
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
          <form onSubmit={submitOwner} className="space-y-3">
            <div className="text-center mb-2">
              <Shield className="size-8 text-primary mx-auto mb-2" />
              <div className="text-base font-bold">دخول المالك</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                للإدارة فقط — الوصول إلى لوحة التحكم.
              </p>
            </div>
            <Field label="البريد الإلكتروني">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm"
              />
            </Field>
            <Field label="كلمة المرور">
              <input
                type="password"
                value={ownerPass}
                onChange={(e) => setOwnerPass(e.target.value)}
                required
                minLength={6}
                placeholder="٦ أحرف على الأقل"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm"
              />
            </Field>
            {err && <ErrBox>{err}</ErrBox>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              دخول لوحة التحكم
            </button>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              عند أول دخول سيتم إنشاء حسابك تلقائياً، وستُمنح صلاحية المالك لأنّ بريدك مُسجَّل ضمن المالكين.
            </p>
          </form>
        )}

        {tab === "student" && (
          <form onSubmit={submitStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface-2 rounded-xl mb-2">
              <button
                type="button"
                onClick={() => { setMode("in"); setErr(""); }}
                className={`py-2 rounded-lg text-[11px] font-bold ${mode === "in" ? "bg-background shadow-soft" : "text-muted-foreground"}`}
              >
                لدي حساب
              </button>
              <button
                type="button"
                onClick={() => { setMode("up"); setErr(""); }}
                className={`py-2 rounded-lg text-[11px] font-bold ${mode === "up" ? "bg-background shadow-soft" : "text-muted-foreground"}`}
              >
                تسجيل جديد
              </button>
            </div>

            <Field label="رقم معرف الطالب">
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                placeholder="مثال: 6A001"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm font-mono"
              />
            </Field>

            {mode === "up" && (
              <>
                <Field label="الاسم الثلاثي">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="مثال: علي حسين كاظم"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الصف">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as Grade)}
                      className="w-full px-3 py-3 rounded-xl bg-surface-2 border border-border text-sm"
                    >
                      {(Object.keys(GRADE_NAMES) as Grade[])
                        .filter((g) => !["general", "parent"].includes(g))
                        .map((g) => (
                          <option key={g} value={g}>
                            {GRADE_NAMES[g]}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="الشعبة">
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
                  </Field>
                </div>
              </>
            )}

            <Field label="كلمة المرور">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="٦ أحرف على الأقل"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm"
              />
            </Field>

            {err && <ErrBox>{err}</ErrBox>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "in" ? "تسجيل الدخول" : "إنشاء حساب طالب"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function ErrBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center font-bold">
      {children}
    </div>
  );
}

function translate(msg?: string): string {
  if (!msg) return "حدث خطأ غير متوقع";
  if (/Invalid login|Invalid credentials/i.test(msg)) return "رقم المعرف أو كلمة المرور غير صحيحة";
  if (/already registered|already exists/i.test(msg)) return "هذا الحساب مسجّل مسبقاً — استخدم تسجيل الدخول";
  if (/Password should be/i.test(msg)) return "كلمة المرور قصيرة جداً (٦ أحرف على الأقل)";
  if (/rate limit/i.test(msg)) return "محاولات كثيرة — حاول بعد قليل";
  return msg;
}
