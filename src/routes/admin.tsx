import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import {
  fetchAdminStats, fetchAnnouncements, createAnnouncement, createNews, createEvent,
  fetchStudents, addGrade, uploadBook, fetchBooks, deleteBook, ar,
} from "@/lib/data";
import { useAuth, signOut } from "@/lib/auth";
import {
  BookPlus, CalendarPlus, GraduationCap, Loader2, LogOut, Megaphone,
  Newspaper, Pin, Plus, Trash2, Users,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | لوحة التحكم" },
      { name: "description", content: "لوحة المالك لإدارة المنصة بالكامل." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isOwner, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isOwner) navigate({ to: "/login" });
  }, [loading, isOwner, navigate]);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats, enabled: isOwner });
  const recent = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, enabled: isOwner });

  if (loading || !isOwner) {
    return (
      <AppShell title="لوحة التحكم">
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  const cards = [
    { label: "الطلاب", value: stats.data?.students ?? 0, hl: true },
    { label: "تبليغات", value: stats.data?.announcements ?? 0 },
    { label: "أخبار", value: stats.data?.news ?? 0 },
    { label: "فعاليات", value: stats.data?.events ?? 0 },
    { label: "كتب", value: stats.data?.books ?? 0 },
  ];

  return (
    <AppShell title="لوحة التحكم">
      <div className="animate-reveal mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">المالك</div>
          <h1 className="text-2xl font-bold">إدارة المنصة</h1>
          <p className="text-xs text-muted-foreground mt-1">إحصائيات حية من قاعدة البيانات.</p>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
          className="size-9 grid place-items-center rounded-xl glass text-destructive"
          aria-label="تسجيل الخروج"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((s, i) => (
          <Card key={i} className={s.hl ? "bg-accent text-accent-foreground" : ""}>
            <div className={`text-[11px] ${s.hl ? "opacity-70" : "text-muted-foreground"}`}>{s.label}</div>
            <div className="text-3xl font-mono font-bold mt-1">{ar(s.value)}</div>
            <div className={`text-[10px] mt-1 ${s.hl ? "opacity-70" : "text-primary"} font-bold`}>
              {stats.isLoading ? "..." : "حالياً"}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle eyebrow="نشر" title="إنشاء محتوى" />
      <ComposerAnnouncement />
      <ComposerNews />
      <ComposerEvent />
      <ComposerGrade />
      <ComposerBook />

      <SectionTitle eyebrow="المستخدمون" title="الطلاب المسجّلون" />
      <StudentsList />

      <SectionTitle eyebrow="المكتبة" title="الكتب المرفوعة" />
      <BooksList />

      <SectionTitle eyebrow="آخر" title="التبليغات الأخيرة" />
      <div className="space-y-2">
        {recent.data?.slice(0, 5).map((a) => (
          <Card key={a.id} className="!p-3">
            <div className="flex items-center gap-2 mb-1">
              {a.pinned && <Pin className="size-3 text-primary" />}
              <div className="font-bold text-sm flex-1 truncate">{a.title}</div>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{a.body}</p>
          </Card>
        ))}
        <Link to="/announcements" className="block text-center text-[11px] font-bold text-primary py-2">
          عرض الكل →
        </Link>
      </div>
    </AppShell>
  );
}

// ---------- Students list ----------
function StudentsList() {
  const students = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const list = students.data ?? [];
  return (
    <div className="space-y-2 mb-5">
      {students.isLoading && <Card className="text-center text-xs text-muted-foreground py-4">جاري التحميل…</Card>}
      {!students.isLoading && list.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-4">لا يوجد طلاب مسجّلون بعد.</Card>
      )}
      {list.map((s) => (
        <Card key={s.id} className="!p-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-sm">
            {s.full_name?.[0] ?? "ط"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{s.full_name || "—"}</div>
            <div className="text-[10px] text-muted-foreground font-mono truncate">
              {s.student_id ?? "—"} · {s.grade}{s.section ? `/${s.section}` : ""}
            </div>
          </div>
          <Users className="size-4 text-muted-foreground shrink-0" />
        </Card>
      ))}
    </div>
  );
}

// ---------- Books list ----------
function BooksList() {
  const qc = useQueryClient();
  const books = useQuery({ queryKey: ["books"], queryFn: fetchBooks });
  const list = books.data ?? [];
  return (
    <div className="space-y-2 mb-5">
      {!books.isLoading && list.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-4">لم تُرفع كتب بعد.</Card>
      )}
      {list.map((b) => (
        <Card key={b.id} className="!p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{b.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {b.subject ?? "—"} · {b.grade ?? "عام"}
            </div>
          </div>
          <button
            onClick={async () => {
              await deleteBook(b);
              qc.invalidateQueries({ queryKey: ["books"] });
              qc.invalidateQueries({ queryKey: ["admin-stats"] });
            }}
            className="size-8 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"
            aria-label="حذف"
          >
            <Trash2 className="size-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}

// ---------- Composers ----------
function ComposerAnnouncement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await createAnnouncement({ title, body, pinned });
      setTitle(""); setBody(""); setPinned(false); setOpen(false);
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally { setBusy(false); }
  }
  return (
    <ComposerShell icon={<Megaphone className="size-4" />} label="إنشاء تبليغ" open={open} onToggle={() => setOpen(o => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <Input value={title} onChange={setTitle} placeholder="العنوان" required />
        <TextArea value={body} onChange={setBody} placeholder="نص التبليغ" required rows={3} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          تثبيت في الأعلى
        </label>
        <SubmitBtn busy={busy} label="نشر التبليغ" />
      </form>
    </ComposerShell>
  );
}

function ComposerNews() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await createNews({ title, body });
      setTitle(""); setBody(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally { setBusy(false); }
  }
  return (
    <ComposerShell icon={<Newspaper className="size-4" />} label="إضافة خبر" open={open} onToggle={() => setOpen(o => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <Input value={title} onChange={setTitle} placeholder="العنوان" required />
        <TextArea value={body} onChange={setBody} placeholder="تفاصيل الخبر" required rows={3} />
        <SubmitBtn busy={busy} label="نشر الخبر" />
      </form>
    </ComposerShell>
  );
}

function ComposerEvent() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [location, setLocation] = useState(""); const [startsAt, setStartsAt] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await createEvent({
        title, description,
        location: location || undefined,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      });
      setTitle(""); setDescription(""); setLocation(""); setStartsAt(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally { setBusy(false); }
  }
  return (
    <ComposerShell icon={<CalendarPlus className="size-4" />} label="إضافة فعالية" open={open} onToggle={() => setOpen(o => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <Input value={title} onChange={setTitle} placeholder="عنوان الفعالية" required />
        <TextArea value={description} onChange={setDescription} placeholder="وصف" rows={2} />
        <Input value={location} onChange={setLocation} placeholder="المكان" />
        <input
          type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <SubmitBtn busy={busy} label="نشر الفعالية" />
      </form>
    </ComposerShell>
  );
}

function ComposerGrade() {
  const qc = useQueryClient();
  const students = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [term, setTerm] = useState("الفصل الحالي");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const n = Number(score);
      if (!studentId) throw new Error("اختر طالباً");
      if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("الدرجة بين 0 و 100");
      await addGrade({ student_id: studentId, subject, score: n, term });
      setSubject(""); setScore(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-grades"] });
    } catch (e: any) {
      setErr(e?.message ?? "تعذّر الحفظ");
    } finally { setBusy(false); }
  }

  return (
    <ComposerShell icon={<GraduationCap className="size-4" />} label="إضافة درجة لطالب" open={open} onToggle={() => setOpen(o => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <select
          value={studentId} onChange={(e) => setStudentId(e.target.value)} required
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        >
          <option value="">— اختر الطالب —</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} {s.student_id ? `(${s.student_id})` : ""}
            </option>
          ))}
        </select>
        <Input value={subject} onChange={setSubject} placeholder="المادة (مثلاً: رياضيات)" required />
        <Input value={score} onChange={setScore} placeholder="الدرجة من 100" required />
        <Input value={term} onChange={setTerm} placeholder="الفصل" />
        {err && <div className="text-[11px] text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center font-bold">{err}</div>}
        <SubmitBtn busy={busy} label="حفظ الدرجة" />
      </form>
    </ComposerShell>
  );
}

function ComposerBook() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (!file) throw new Error("اختر ملف الكتاب");
      await uploadBook({ file, title, subject: subject || undefined, grade: grade || undefined });
      setTitle(""); setSubject(""); setGrade(""); setFile(null); setOpen(false);
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      setErr(e?.message ?? "تعذّر رفع الكتاب");
    } finally { setBusy(false); }
  }

  return (
    <ComposerShell icon={<BookPlus className="size-4" />} label="رفع كتاب" open={open} onToggle={() => setOpen(o => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <Input value={title} onChange={setTitle} placeholder="عنوان الكتاب" required />
        <Input value={subject} onChange={setSubject} placeholder="المادة (اختياري)" />
        <Input value={grade} onChange={setGrade} placeholder="الصف (اختياري)" />
        <input
          type="file" accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-xs"
        />
        {err && <div className="text-[11px] text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center font-bold">{err}</div>}
        <SubmitBtn busy={busy} label="رفع ونشر" />
      </form>
    </ComposerShell>
  );
}

// ---------- Helpers ----------
function Input({ value, onChange, placeholder, required }: {
  value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  return (
    <input
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
    />
  );
}
function TextArea({ value, onChange, placeholder, required, rows }: {
  value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} rows={rows ?? 3}
      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none"
    />
  );
}

function ComposerShell({ icon, label, open, onToggle, children }: {
  icon: React.ReactNode; label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="!p-3 mb-2.5">
      <button onClick={onToggle} className="flex items-center gap-3 w-full text-right">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
        <div className="font-bold text-sm flex-1">{label}</div>
        <Plus className={`size-4 text-muted-foreground transition ${open ? "rotate-45" : ""}`} />
      </button>
      {open && <div className="mt-3 pt-3 border-t border-border">{children}</div>}
    </Card>
  );
}

function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={busy}
      className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </button>
  );
}
