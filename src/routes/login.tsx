import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setUser, GRADE_NAMES, type Grade, type Section } from "@/lib/store";
import {
  OWNER_EMAIL,
  signInOwner,
  signInStudent,
  signUpOwner,
  requestStudentRegistration,
  checkRegistrationStatus,
} from "@/lib/auth";
import { CheckCircle, Clock, Loader2, Shield, XCircle } from "lucide-react";

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
type Mode = "in" | "up" | "status";

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
  const [success, setSuccess] = useState("");
  const [statusResult, setStatusResult] = useState<{ status: string; rejection_reason?: string | null; created_at?: string } | null>(null);

  async function submitStudent(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSuccess("");
    setBusy(true);
    try {
      if (mode === "in") {
        await signInStudent(studentId, password);
        // Wait for Supabase auth state to update store before navigating
        await new Promise(r => setTimeout(r, 300));
        navigate({ to: "/" });
      } else if (mode === "up") {
        await requestStudentRegistration({ studentId, password, fullName, grade, section });
        setSuccess("تم إرسال طلبك! انتظر موافقة الإدارة قبل تسجيل الدخول.");
        setMode("in");
        setStudentId(""); setPassword(""); setFullName("");
      }
    } catch (e: any) {
      setErr(translate(e?.message));
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setStatusResult(null);
    setBusy(true);
    try {
      const result = await checkRegistrationStatus(studentId);
      if (!result) { setErr("لم يتم العثور على طلب بهذا الرقم"); }
      else setStatusResult(result);
    } catch (e: any) {
      setErr(translate(e?.message));
    } finally {
      setBusy(false);
    }
  }

  async function submitOwner(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSuccess("");
    setBusy(true);
    try {
      try {
        await signInOwner(email, ownerPass);
      } catch (innerErr: any) {
        if (/invalid login|invalid credentials/i.test(innerErr?.message ?? "")) {
          await signUpOwner(email, ownerPass);
          await signInOwner(email, ownerPass);
        } else {
          throw innerErr;
        }
      }
      // Wait for auth state to propagate
      await new Promise(r => setTimeout(r, 300));
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

      {/* Tabs */}
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
            onClick={() => { setTab(id); setErr(""); setSuccess(""); setStatusResult(null); }}
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

        {/* ===== GUEST ===== */}
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

        {/* ===== OWNER ===== */}
        {tab === "owner" && (
          <form onSubmit={submitOwner} className="space-y-3">
            <div className="text-center mb-2">
              <Shield className="size-8 text-primary mx-auto mb-2" />
              <div className="text-base font-bold">دخول المالك / الإداريين</div>
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
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
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
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
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
          </form>
        )}

        {/* ===== STUDENT ===== */}
        {tab === "student" && (
          <>
            {/* Mode pills */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-2 rounded-xl mb-4">
              {(["in", "up", "status"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErr(""); setSuccess(""); setStatusResult(null); }}
                  className={`py-2 rounded-lg text-[11px] font-bold transition ${mode === m ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
                >
                  {m === "in" ? "دخول" : m === "up" ? "تسجيل جديد" : "حالة طلبي"}
                </button>
              ))}
            </div>

            {/* SUCCESS */}
            {success && (
              <div className="flex items-start gap-2 text-[11px] bg-primary/10 text-primary rounded-xl px-3 py-3 mb-3 font-bold">
                <CheckCircle className="size-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            {/* LOGIN */}
            {mode === "in" && (
              <form onSubmit={submitStudent} className="space-y-3">
                <Field label="رقم معرف الطالب">
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="مثال: 6A001"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm font-mono text-foreground"
                  />
                </Field>
                <Field label="كلمة المرور">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="٦ أحرف على الأقل"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                  />
                </Field>
                {err && <ErrBox>{err}</ErrBox>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  تسجيل الدخول
                </button>
              </form>
            )}

            {/* REGISTER REQUEST */}
            {mode === "up" && (
              <form onSubmit={submitStudent} className="space-y-3">
                <div className="text-[11px] text-muted-foreground bg-surface-2 rounded-xl px-3 py-2.5 leading-relaxed">
                  📋 سيُرسل طلبك للمراجعة — يمكن للإدارة الموافقة أو الرفض. ستتمكن من الدخول بعد الموافقة.
                </div>
                <Field label="رقم معرف الطالب">
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="مثال: 6A001"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm font-mono text-foreground"
                  />
                </Field>
                <Field label="الاسم الثلاثي">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="مثال: علي حسين كاظم"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الصف">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as Grade)}
                      className="w-full px-3 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                    >
                      {(Object.keys(GRADE_NAMES) as Grade[])
                        .filter((g) => !["general", "parent"].includes(g))
                        .map((g) => (
                          <option key={g} value={g}>{GRADE_NAMES[g]}</option>
                        ))}
                    </select>
                  </Field>
                  <Field label="الشعبة">
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value as Section)}
                      className="w-full px-3 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                    >
                      {(["أ", "ب", "ج", "د"] as Section[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="كلمة المرور (ستُستخدم بعد الموافقة)">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="٦ أحرف على الأقل"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                  />
                </Field>
                {err && <ErrBox>{err}</ErrBox>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  إرسال طلب التسجيل
                </button>
              </form>
            )}

            {/* CHECK STATUS */}
            {mode === "status" && (
              <div className="space-y-3">
                <form onSubmit={checkStatus} className="space-y-3">
                  <Field label="رقم معرف الطالب">
                    <input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      placeholder="مثال: 6A001"
                      className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm font-mono text-foreground"
                    />
                  </Field>
                  {err && <ErrBox>{err}</ErrBox>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    تحقق من الحالة
                  </button>
                </form>

                {statusResult && (
                  <div className={`rounded-2xl p-4 flex items-start gap-3 ${
                    statusResult.status === "approved" ? "bg-primary/10 text-primary" :
                    statusResult.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-surface-2 text-foreground"
                  }`}>
                    {statusResult.status === "approved" && <CheckCircle className="size-5 shrink-0 mt-0.5" />}
                    {statusResult.status === "rejected" && <XCircle className="size-5 shrink-0 mt-0.5" />}
                    {statusResult.status === "pending" && <Clock className="size-5 shrink-0 mt-0.5" />}
                    <div>
                      <div className="font-bold text-sm mb-1">
                        {statusResult.status === "approved" && "✅ تمت الموافقة — يمكنك الدخول الآن"}
                        {statusResult.status === "rejected" && "❌ تم الرفض"}
                        {statusResult.status === "pending" && "⏳ طلبك قيد المراجعة"}
                      </div>
                      {statusResult.rejection_reason && (
                        <div className="text-[11px] opacity-80">السبب: {statusResult.rejection_reason}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
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
