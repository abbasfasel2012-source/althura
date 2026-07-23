import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ar, fetchQuizzes, createQuiz, deleteQuiz, type QuestionType,
} from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { GRADE_NAMES, type Grade } from "@/lib/store";
import { Loader2, Plus, Trash2, ClipboardCheck, X, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الاختبارات" },
      { name: "description", content: "اختبارات تفاعلية مع تصحيح ذكي." },
    ],
  }),
  component: ExamsPage,
});

interface DraftQ {
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
}

const GRADES: Grade[] = ["1","2","3","4","5","6"];

function ExamsPage() {
  const { isOwner, profile } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data: quizzes = [], isLoading } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });

  const visible = isOwner
    ? quizzes
    : quizzes.filter((q) => {
        const gOk = !q.grade || q.grade === profile?.grade;
        const sOk = !q.section || q.section === (profile?.section ?? null);
        return gOk && sOk && q.is_published;
      });

  const del = useMutation({
    mutationFn: (id: string) => deleteQuiz(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });

  return (
    <AppShell title="الاختبارات">
      <div className="animate-reveal flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">تصحيح ذكي</div>
          <h1 className="text-2xl font-bold">
            {visible.length > 0 ? `${ar(visible.length)} اختبارات متاحة` : "الاختبارات"}
          </h1>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCreate(true)}
            className="size-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-soft"
            aria-label="اختبار جديد"
          >
            <Plus className="size-5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">
          لا توجد اختبارات متاحة الآن.
        </Card>
      ) : (
        <div className="space-y-3 mt-5">
          {visible.map((q, i) => (
            <Card key={q.id} className="animate-reveal">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">{q.subject}</div>
                  <Link to="/exams/$quizId" params={{ quizId: q.id }} className="font-bold block truncate hover:text-primary">
                    {q.title}
                  </Link>
                  {q.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{q.description}</p>}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
                    <GraduationCap className="size-3" />
                    {q.grade ? `صف ${ar(q.grade)}` : "كل الصفوف"}
                    {q.section ? ` • شعبة ${q.section}` : ""}
                    {q.duration_minutes ? ` • ${ar(q.duration_minutes)} د` : ""}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Link
                    to="/exams/$quizId" params={{ quizId: q.id }}
                    className="px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold flex items-center gap-1"
                  >
                    <ClipboardCheck className="size-3.5" /> ابدأ
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() => confirm("حذف الاختبار؟") && del.mutate(q.id)}
                      className="text-destructive text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> حذف
                    </button>
                  )}
                </div>
              </div>
              <div className="ink-watermark">{ar(String(i + 1).padStart(2, "0"))}</div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && isOwner && (
        <CreateQuizModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["quizzes"] }); }} />
      )}
    </AppShell>
  );
}

function CreateQuizModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [section, setSection] = useState("");
  const [duration, setDuration] = useState(30);
  const [qs, setQs] = useState<DraftQ[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addQ = (type: QuestionType) => {
    setQs((prev) => [...prev, {
      type,
      question: "",
      options: type === "mcq" ? ["", "", "", ""] : type === "true_false" ? ["صح", "خطأ"] : [],
      correct_answer: type === "true_false" ? "صح" : "",
      points: 1,
    }]);
  };

  const update = (i: number, patch: Partial<DraftQ>) => {
    setQs((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };
  const remove = (i: number) => setQs((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setErr(null);
    if (!title.trim() || !subject.trim()) { setErr("العنوان والمادة مطلوبان"); return; }
    if (qs.length === 0) { setErr("أضف سؤالاً واحداً على الأقل"); return; }
    setBusy(true);
    try {
      await createQuiz({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || undefined,
        grade: grade || null,
        section: section.trim() || null,
        duration_minutes: duration,
        questions: qs.map((q) => ({
          type: q.type,
          question: q.question,
          options: q.type === "mcq" ? q.options.filter((o) => o.trim()) : undefined,
          correct_answer: q.correct_answer,
          points: q.points,
        })),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الإنشاء");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="glass-strong rounded-3xl p-4 max-w-lg mx-auto my-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">اختبار جديد</h2>
            <button onClick={onClose} className="size-8 grid place-items-center rounded-xl bg-surface-2/60"><X className="size-4" /></button>
          </div>

          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الاختبار" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="المادة" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف اختياري" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none" />
            <div className="grid grid-cols-3 gap-2">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm">
                <option value="">كل الصفوف</option>
                {GRADES.map((g) => <option key={g} value={g}>صف {g}</option>)}
              </select>
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="شعبة (اختياري)" className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
              <input type="number" value={duration} onChange={(e) => setDuration(+e.target.value || 0)} placeholder="الدقائق" className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold">الأسئلة ({ar(qs.length)})</div>
              <div className="flex gap-1.5">
                <button onClick={() => addQ("mcq")} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">+ اختيارات</button>
                <button onClick={() => addQ("true_false")} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">+ صح/خطأ</button>
                <button onClick={() => addQ("text")} className="text-[10px] px-2 py-1 rounded-lg bg-accent/20 text-accent font-bold">+ نصي (AI)</button>
              </div>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto">
              {qs.map((q, i) => (
                <div key={i} className="p-3 rounded-2xl bg-surface-2/50 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary">
                      {q.type === "mcq" ? "اختيار من متعدد" : q.type === "true_false" ? "صح/خطأ" : "نصي (تصحيح AI)"}
                    </span>
                    <button onClick={() => remove(i)} className="text-destructive"><X className="size-4" /></button>
                  </div>
                  <input value={q.question} onChange={(e) => update(i, { question: e.target.value })} placeholder="نص السؤال" className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-sm" />

                  {q.type === "mcq" && (
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={q.correct_answer === opt && opt !== ""}
                            onChange={() => update(i, { correct_answer: opt })}
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options]; newOpts[oi] = e.target.value;
                              const patch: Partial<DraftQ> = { options: newOpts };
                              if (q.correct_answer === opt) patch.correct_answer = e.target.value;
                              update(i, patch);
                            }}
                            placeholder={`الخيار ${oi + 1}`}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-background border border-border text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "true_false" && (
                    <div className="flex gap-2">
                      {["صح", "خطأ"].map((v) => (
                        <label key={v} className={`flex-1 text-center py-1.5 rounded-lg border cursor-pointer text-xs ${q.correct_answer === v ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border"}`}>
                          <input type="radio" name={`tf-${i}`} className="hidden" checked={q.correct_answer === v} onChange={() => update(i, { correct_answer: v })} />
                          {v}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "text" && (
                    <textarea
                      value={q.correct_answer}
                      onChange={(e) => update(i, { correct_answer: e.target.value })}
                      placeholder="الإجابة المرجعية (يستخدمها الذكاء الاصطناعي للتصحيح)"
                      rows={2}
                      className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs resize-none"
                    />
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">الدرجة:</span>
                    <input type="number" min={1} value={q.points} onChange={(e) => update(i, { points: Math.max(1, +e.target.value || 1) })} className="w-16 px-2 py-1 rounded-lg bg-background border border-border" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {err && <div className="mt-3 text-xs text-destructive">{err}</div>}

          <button disabled={busy} onClick={submit} className="mt-4 w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold disabled:opacity-50">
            {busy ? "جارٍ الحفظ…" : "حفظ الاختبار"}
          </button>
        </div>
      </div>
    </div>
  );
}
