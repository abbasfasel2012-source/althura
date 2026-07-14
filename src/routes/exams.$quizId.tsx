import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ar, fetchQuizWithQuestions, startOrGetAttempt, submitQuiz, fetchAttemptAnswers,
} from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronRight, Sparkles, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/exams/$quizId")({
  head: () => ({
    meta: [{ title: "الذرى الذكية | اختبار" }],
  }),
  component: TakeQuizPage,
});

function TakeQuizPage() {
  const { quizId } = Route.useParams();
  const { userId, loading } = useAuth();
  const navigate = useNavigate();

  const quizQ = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => fetchQuizWithQuestions(quizId),
    enabled: !!quizId,
  });

  const attemptQ = useQuery({
    queryKey: ["attempt", quizId, userId],
    queryFn: () => startOrGetAttempt(quizId),
    enabled: !!userId && !!quizId,
  });

  const attempt = attemptQ.data;
  const isGraded = attempt?.status === "graded";

  const answersQ = useQuery({
    queryKey: ["attempt-answers", attempt?.id],
    queryFn: () => fetchAttemptAnswers(attempt!.id),
    enabled: !!attempt && isGraded,
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submitMut = useMutation({
    mutationFn: () => submitQuiz({ attemptId: attempt!.id, quizId, answers }),
    onSuccess: () => { attemptQ.refetch(); answersQ.refetch(); },
  });

  const questions = quizQ.data?.questions ?? [];
  const quiz = quizQ.data?.quiz;

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  }, [answers, questions.length]);

  useEffect(() => {
    if (!loading && !userId) navigate({ to: "/login" });
  }, [loading, userId, navigate]);

  if (quizQ.isLoading || attemptQ.isLoading || !quiz) {
    return (
      <AppShell title="اختبار"><div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div></AppShell>
    );
  }

  // Results view
  if (isGraded && answersQ.data) {
    const answerMap = new Map(answersQ.data.map((a) => [a.question_id, a]));
    const pct = attempt.max_score ? Math.round(((attempt.score ?? 0) / attempt.max_score) * 100) : 0;
    return (
      <AppShell title={quiz.title}>
        <div className="animate-reveal">
          <Link to="/exams" className="text-xs text-primary flex items-center gap-1 mb-3"><ArrowRight className="size-3" /> رجوع</Link>
          <Card className="text-center">
            <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">النتيجة</div>
            <div className="text-5xl font-mono font-bold text-accent">{ar(pct)}%</div>
            <div className="text-sm text-muted-foreground mt-1">
              {ar(Number(attempt.score ?? 0).toFixed(1))} من {ar(Number(attempt.max_score ?? 0).toFixed(0))} درجة
            </div>
          </Card>
        </div>

        <div className="space-y-3 mt-5">
          {questions.map((q, i) => {
            const a = answerMap.get(q.id);
            const correct = a?.is_correct === true;
            const partial = a?.is_correct === null && (a?.points_awarded ?? 0) > 0;
            return (
              <Card key={q.id}>
                <div className="flex items-start gap-2">
                  <div className="text-xs font-bold text-muted-foreground">{ar(i + 1)}.</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{q.question}</div>
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">إجابتك: </span>
                      <span className="font-medium">{a?.answer || "—"}</span>
                    </div>
                    {q.type !== "text" && q.correct_answer && !correct && (
                      <div className="text-xs mt-1"><span className="text-muted-foreground">الصحيح: </span><span className="text-accent font-bold">{q.correct_answer}</span></div>
                    )}
                    {q.type === "text" && a?.ai_feedback && (
                      <div className="mt-2 p-2 rounded-xl bg-primary/5 border border-primary/20 text-[11px] flex gap-2">
                        <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div>{a.ai_feedback}</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      {correct ? (
                        <><CheckCircle2 className="size-3.5 text-accent" /> <span className="text-accent font-bold">صحيح</span></>
                      ) : partial ? (
                        <><Sparkles className="size-3.5 text-primary" /><span className="text-primary font-bold">جزئي</span></>
                      ) : (
                        <><XCircle className="size-3.5 text-destructive" /> <span className="text-destructive font-bold">خطأ</span></>
                      )}
                      <span className="text-muted-foreground mr-auto">{ar(Number(a?.points_awarded ?? 0).toFixed(1))}/{ar(q.points)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </AppShell>
    );
  }

  if (questions.length === 0) {
    return (
      <AppShell title={quiz.title}>
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">لا توجد أسئلة في هذا الاختبار بعد.</Card>
      </AppShell>
    );
  }

  const q = questions[current];
  const onSubmit = async () => {
    setSubmitting(true);
    try { await submitMut.mutateAsync(); } finally { setSubmitting(false); }
  };

  return (
    <AppShell title={quiz.title}>
      <div className="animate-reveal">
        <Link to="/exams" className="text-xs text-primary flex items-center gap-1 mb-3"><ArrowRight className="size-3" /> رجوع</Link>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
          <span>سؤال {ar(current + 1)} من {ar(questions.length)}</span>
          <span>{ar(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-4">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card>
        <div className="text-[10px] font-bold tracking-[0.2em] text-primary mb-2 uppercase">
          {q.type === "mcq" ? "اختر إجابة" : q.type === "true_false" ? "صح أم خطأ" : "أجب نصياً"}
        </div>
        <div className="font-bold mb-4">{q.question}</div>

        {q.type === "mcq" && q.options && (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`w-full text-right px-3 py-3 rounded-2xl border text-sm transition ${selected ? "bg-accent text-accent-foreground border-accent" : "bg-surface-2/50 border-border"}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "true_false" && (
          <div className="grid grid-cols-2 gap-2">
            {["صح", "خطأ"].map((v) => {
              const selected = answers[q.id] === v;
              return (
                <button key={v} onClick={() => setAnswers({ ...answers, [q.id]: v })}
                  className={`py-4 rounded-2xl border font-bold ${selected ? "bg-accent text-accent-foreground border-accent" : "bg-surface-2/50 border-border"}`}>
                  {v}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "text" && (
          <>
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              rows={5}
              placeholder="اكتب إجابتك…"
              className="w-full px-3 py-2.5 rounded-2xl bg-surface-2 border border-border text-sm resize-none"
            />
            <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              سيتم تصحيح إجابتك تلقائياً بالذكاء الاصطناعي
            </div>
          </>
        )}
      </Card>

      <div className="flex items-center gap-2 mt-4">
        <button
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold disabled:opacity-40"
        >
          السابق
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="flex-1 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center gap-1"
          >
            التالي <ChevronRight className="size-4 rotate-180" />
          </button>
        ) : (
          <button
            disabled={submitting}
            onClick={onSubmit}
            className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            {submitting ? "جارٍ التصحيح…" : "إنهاء وتصحيح"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
