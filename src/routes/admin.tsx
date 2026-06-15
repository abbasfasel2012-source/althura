import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import {
  fetchAdminStats, fetchAnnouncements, createAnnouncement, createNews, createEvent,
  fetchStudents, addGrade, uploadBook, fetchBooks, deleteBook, ar,
  fetchPendingRegistrations, approveRegistration, rejectRegistration, deleteRegistration,
  fetchWeekSchedule, fetchDayPeriods, upsertPeriod, deletePeriod, setDayHoliday,
  fetchAdmins, setAdminLabel, deleteUser,
  type PendingRegistration,
} from "@/lib/data";
import { useAuth, signOut } from "@/lib/auth";
import {
  BookPlus, CalendarPlus, Check, ChevronDown, GraduationCap,
  Loader2, LogOut, Megaphone, Newspaper, Palmtree, Pin,
  Plus, Shield, Trash2, UserCheck, UserX, Users, X, Tag,
  CalendarDays,
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

// ========== TABS ==========
type AdminTab = "overview" | "requests" | "schedule" | "students" | "content" | "admins";

function AdminPage() {
  const { isOwner, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");

  useEffect(() => {
    if (!loading && !isOwner) navigate({ to: "/login" });
  }, [loading, isOwner, navigate]);

  if (loading || !isOwner) {
    return (
      <AppShell title="لوحة التحكم">
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "overview",  label: "نظرة عامة" },
    { id: "requests",  label: "الطلبات" },
    { id: "schedule",  label: "الجدول" },
    { id: "students",  label: "الطلاب" },
    { id: "content",   label: "المحتوى" },
    { id: "admins",    label: "الإداريون" },
  ];

  return (
    <AppShell title="لوحة التحكم">
      {/* Header */}
      <div className="animate-reveal mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">المالك</div>
          <h1 className="text-2xl font-bold">إدارة المنصة</h1>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
          className="size-9 grid place-items-center rounded-xl glass border border-border text-destructive"
          aria-label="تسجيل الخروج"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-5 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
              tab === t.id
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface-2 text-muted-foreground border-border"
            }`}
          >
            {t.label}
            {t.id === "requests" && <PendingBadge />}
          </button>
        ))}
      </div>

      {tab === "overview"  && <TabOverview />}
      {tab === "requests"  && <TabRequests />}
      {tab === "schedule"  && <TabSchedule />}
      {tab === "students"  && <TabStudents />}
      {tab === "content"   && <TabContent />}
      {tab === "admins"    && <TabAdmins />}
    </AppShell>
  );
}

// ===== PENDING BADGE =====
function PendingBadge() {
  const q = useQuery({ queryKey: ["pending-regs"], queryFn: fetchPendingRegistrations });
  const count = (q.data ?? []).filter((r) => r.status === "pending").length;
  if (!count) return null;
  return (
    <span className="mr-1 inline-flex items-center justify-center size-4 rounded-full bg-destructive text-white text-[9px] font-bold">
      {count}
    </span>
  );
}

// ===== TAB: OVERVIEW =====
function TabOverview() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const cards = [
    { label: "الطلاب",    value: stats.data?.students ?? 0,      hl: true },
    { label: "تبليغات",   value: stats.data?.announcements ?? 0 },
    { label: "أخبار",     value: stats.data?.news ?? 0 },
    { label: "فعاليات",   value: stats.data?.events ?? 0 },
    { label: "كتب",       value: stats.data?.books ?? 0 },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((s, i) => (
          <Card key={i} className={s.hl ? "bg-accent text-accent-foreground" : ""}>
            <div className={`text-[11px] font-medium ${s.hl ? "opacity-70" : "text-muted-foreground"}`}>{s.label}</div>
            <div className="text-3xl font-mono font-bold mt-1">{ar(s.value)}</div>
            <div className={`text-[10px] mt-1 ${s.hl ? "opacity-70" : "text-primary"} font-bold`}>
              {stats.isLoading ? "..." : "حالياً"}
            </div>
          </Card>
        ))}
      </div>
      <RecentAnnouncements />
    </>
  );
}

function RecentAnnouncements() {
  const q = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  return (
    <>
      <SectionTitle eyebrow="آخر" title="التبليغات الأخيرة" />
      <div className="space-y-2">
        {q.data?.slice(0, 5).map((a) => (
          <Card key={a.id} className="!p-3">
            <div className="flex items-center gap-2 mb-1">
              {a.pinned && <Pin className="size-3 text-primary" />}
              <div className="font-bold text-sm flex-1 truncate text-foreground">{a.title}</div>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{a.body}</p>
          </Card>
        ))}
        <Link to="/announcements" className="block text-center text-[11px] font-bold text-primary py-2">
          عرض الكل →
        </Link>
      </div>
    </>
  );
}

// ===== TAB: REQUESTS (طلبات التسجيل) =====
function TabRequests() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pending-regs"], queryFn: fetchPendingRegistrations });
  const list = q.data ?? [];
  const pending  = list.filter((r) => r.status === "pending");
  const approved = list.filter((r) => r.status === "approved");
  const rejected = list.filter((r) => r.status === "rejected");

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(reg: PendingRegistration) {
    setBusy(reg.id);
    try {
      await approveRegistration(reg);
      qc.invalidateQueries({ queryKey: ["pending-regs"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      alert("خطأ: " + (e?.message ?? "تعذّرت الموافقة"));
    } finally { setBusy(null); }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      await rejectRegistration(id, rejectReason);
      setRejectId(null); setRejectReason("");
      qc.invalidateQueries({ queryKey: ["pending-regs"] });
    } finally { setBusy(null); }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await deleteRegistration(id);
      qc.invalidateQueries({ queryKey: ["pending-regs"] });
    } finally { setBusy(null); }
  }

  if (q.isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle eyebrow={`${ar(pending.length)} طلب`} title="قيد الانتظار" />
      {pending.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-8 mb-5">لا توجد طلبات جديدة.</Card>
      )}
      <div className="space-y-3 mb-6">
        {pending.map((r) => (
          <Card key={r.id} className="!p-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                {r.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground">{r.full_name}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {r.student_id} · الصف {r.grade}{r.section ? `/${r.section}` : ""}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleDateString("ar-IQ")}
                </div>
              </div>
            </div>

            {rejectId === r.id ? (
              <div className="mt-3 space-y-2">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="سبب الرفض (اختياري)"
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => reject(r.id)}
                    disabled={!!busy}
                    className="flex-1 py-2 rounded-xl bg-destructive text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    {busy === r.id ? <Loader2 className="size-3 animate-spin" /> : <UserX className="size-3" />}
                    تأكيد الرفض
                  </button>
                  <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-xl bg-surface-2 text-xs font-bold text-foreground">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => approve(r)}
                  disabled={!!busy}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {busy === r.id ? <Loader2 className="size-3 animate-spin" /> : <UserCheck className="size-3" />}
                  موافقة
                </button>
                <button
                  onClick={() => { setRejectId(r.id); setRejectReason(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-destructive/10 text-destructive font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <UserX className="size-3" /> رفض
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {approved.length > 0 && (
        <>
          <SectionTitle eyebrow="تمت الموافقة" title={`${ar(approved.length)} طلب`} />
          <div className="space-y-2 mb-5">
            {approved.map((r) => (
              <Card key={r.id} className="!p-3 flex items-center gap-3">
                <Check className="size-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">{r.full_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{r.student_id}</div>
                </div>
                <button onClick={() => remove(r.id)} disabled={!!busy} className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      {rejected.length > 0 && (
        <>
          <SectionTitle eyebrow="مرفوضة" title={`${ar(rejected.length)} طلب`} />
          <div className="space-y-2 mb-5">
            {rejected.map((r) => (
              <Card key={r.id} className="!p-3 flex items-center gap-3">
                <X className="size-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">{r.full_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{r.student_id}</div>
                  {r.rejection_reason && <div className="text-[10px] text-destructive">{r.rejection_reason}</div>}
                </div>
                <button onClick={() => remove(r.id)} disabled={!!busy} className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ===== TAB: SCHEDULE (الجدول الأسبوعي) =====
function TabSchedule() {
  const qc = useQueryClient();
  const daysQ = useQuery({ queryKey: ["week-schedule"], queryFn: fetchWeekSchedule });
  const days = daysQ.data ?? [];
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [busyHoliday, setBusyHoliday] = useState<string | null>(null);
  const [holidayLabel, setHolidayLabel] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? days[0];

  const periodsQ = useQuery({
    queryKey: ["day-periods", selectedDay?.id],
    queryFn: () => fetchDayPeriods(selectedDay!.id),
    enabled: !!selectedDay,
  });
  const periods = periodsQ.data ?? [];

  const [newTime, setNewTime] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  async function addPeriod() {
    if (!selectedDay || !newTime || !newSubject) return;
    setAddBusy(true);
    try {
      await upsertPeriod({
        day_id: selectedDay.id,
        period_number: periods.length + 1,
        start_time: newTime,
        subject: newSubject,
        teacher: newTeacher || null,
        room: newRoom || null,
      });
      setNewTime(""); setNewSubject(""); setNewTeacher(""); setNewRoom("");
      qc.invalidateQueries({ queryKey: ["day-periods", selectedDay.id] });
      qc.invalidateQueries({ queryKey: ["week-schedule"] });
    } finally { setAddBusy(false); }
  }

  async function toggleHoliday(day: typeof days[0]) {
    setBusyHoliday(day.id);
    try {
      if (day.is_holiday) {
        await setDayHoliday(day.id, false, undefined);
      } else {
        await setDayHoliday(day.id, true, holidayLabel || "عطلة");
        setHolidayLabel("");
      }
      qc.invalidateQueries({ queryKey: ["week-schedule"] });
    } finally { setBusyHoliday(null); }
  }

  if (daysQ.isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle eyebrow="الجدول" title="الأسبوعي" />

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-none">
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDayId(d.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${
              (selectedDay?.id === d.id)
                ? "bg-accent text-accent-foreground border-accent"
                : d.is_holiday
                ? "bg-surface-2 text-muted-foreground border-border opacity-50"
                : "bg-surface-2 text-muted-foreground border-border"
            }`}
          >
            {d.day_name}{d.is_holiday ? " 🌴" : ""}
          </button>
        ))}
      </div>

      {selectedDay && (
        <>
          {/* Holiday toggle */}
          <Card className="!p-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palmtree className={`size-4 ${selectedDay.is_holiday ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {selectedDay.is_holiday ? `عطلة: ${selectedDay.holiday_label ?? "عطلة"}` : "يوم دراسي"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">اضغط للتبديل</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selectedDay.is_holiday && (
                  <input
                    value={holidayLabel}
                    onChange={(e) => setHolidayLabel(e.target.value)}
                    placeholder="اسم العطلة"
                    className="px-2 py-1.5 rounded-xl bg-surface-2 border border-border text-xs text-foreground w-28"
                  />
                )}
                <button
                  onClick={() => toggleHoliday(selectedDay)}
                  disabled={busyHoliday === selectedDay.id}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                    selectedDay.is_holiday
                      ? "bg-surface-2 text-muted-foreground border border-border"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {busyHoliday === selectedDay.id
                    ? <Loader2 className="size-3 animate-spin" />
                    : selectedDay.is_holiday ? "إلغاء العطلة" : "تعيين عطلة"}
                </button>
              </div>
            </div>
          </Card>

          {/* Periods list */}
          {!selectedDay.is_holiday && (
            <>
              <div className="space-y-2 mb-4">
                {periodsQ.isLoading && <Spinner />}
                {!periodsQ.isLoading && periods.length === 0 && (
                  <Card className="text-center text-xs text-muted-foreground py-6">
                    لا توجد حصص — أضف من الأسفل.
                  </Card>
                )}
                {periods.map((p, i) => (
                  <Card key={p.id} className="!p-3 flex items-center gap-3">
                    <div className="font-mono text-xs text-muted-foreground w-12 shrink-0">{p.start_time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">{p.subject}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {[p.teacher, p.room].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await deletePeriod(p.id);
                        qc.invalidateQueries({ queryKey: ["day-periods", selectedDay.id] });
                      }}
                      className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Card>
                ))}
              </div>

              {/* Add period form */}
              <Card className="!p-4">
                <div className="text-xs font-bold text-muted-foreground mb-3">إضافة حصة جديدة</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                    />
                    <SmInput value={newSubject} onChange={setNewSubject} placeholder="المادة *" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SmInput value={newTeacher} onChange={setNewTeacher} placeholder="الأستاذ" />
                    <SmInput value={newRoom} onChange={setNewRoom} placeholder="القاعة" />
                  </div>
                  <button
                    onClick={addPeriod}
                    disabled={addBusy || !newTime || !newSubject}
                    className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {addBusy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    إضافة الحصة
                  </button>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}

// ===== TAB: STUDENTS =====
function TabStudents() {
  const qc = useQueryClient();
  const students = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const list = students.data ?? [];
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string, name: string) {
    if (!confirm(`حذف ${name}؟ لا يمكن التراجع.`)) return;
    setBusy(id);
    try {
      await deleteUser(id);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally { setBusy(null); }
  }

  if (students.isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle eyebrow={`${ar(list.length)} طالب`} title="الطلاب المسجّلون" />
      {list.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-8">لا يوجد طلاب مسجّلون بعد.</Card>
      )}
      <div className="space-y-2">
        {list.map((s) => (
          <Card key={s.id} className="!p-3 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
              {s.full_name?.[0] ?? "ط"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground truncate">{s.full_name || "—"}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">
                {s.student_id ?? "—"} · {s.grade}{s.section ? `/${s.section}` : ""}
              </div>
            </div>
            <button
              onClick={() => remove(s.id, s.full_name)}
              disabled={!!busy}
              className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive"
            >
              {busy === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <SectionTitle eyebrow="درجات" title="إضافة درجة لطالب" />
        <ComposerGrade />
      </div>

      <div className="mt-4">
        <SectionTitle eyebrow="المكتبة" title="الكتب المرفوعة" />
        <BooksList />
        <ComposerBook />
      </div>
    </>
  );
}

// ===== TAB: CONTENT =====
function TabContent() {
  return (
    <>
      <SectionTitle eyebrow="نشر" title="إنشاء محتوى" />
      <ComposerAnnouncement />
      <ComposerNews />
      <ComposerEvent />
    </>
  );
}

// ===== TAB: ADMINS (الإداريون بلقب) =====
function TabAdmins() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admins"], queryFn: fetchAdmins });
  const list = q.data ?? [];
  const [editId, setEditId] = useState<string | null>(null);
  const [labelVal, setLabelVal] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function saveLabel(id: string) {
    setBusy(id);
    try {
      await setAdminLabel(id, labelVal);
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["admins"] });
    } finally { setBusy(null); }
  }

  if (q.isLoading) return <Spinner />;

  return (
    <>
      <SectionTitle eyebrow="الإداريون" title="قائمة المالكين" />
      <div className="text-[11px] text-muted-foreground mb-4 glass rounded-2xl px-4 py-3 leading-relaxed">
        يمكنك إضافة لقب لكل أدمن (مثلاً: مدرس العربي، المدير المساعد). اللقب يظهر في ملفه الشخصي.
      </div>
      {list.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-8">لا يوجد إداريون مسجّلون.</Card>
      )}
      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className="!p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold text-sm shrink-0">
                <Shield className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate">{(a as any).full_name || "—"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{(a as any).email}</div>
                {(a as any).admin_label && (
                  <div className="text-[10px] text-primary font-bold mt-0.5">
                    🏷 {(a as any).admin_label}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setEditId(a.id); setLabelVal((a as any).admin_label ?? ""); }}
                className="size-8 grid place-items-center rounded-xl bg-primary/10 text-primary"
              >
                <Tag className="size-3.5" />
              </button>
            </div>

            {editId === a.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={labelVal}
                  onChange={(e) => setLabelVal(e.target.value)}
                  placeholder="مثال: مدرس العربي"
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-border text-sm text-foreground"
                />
                <button
                  onClick={() => saveLabel(a.id)}
                  disabled={!!busy}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs"
                >
                  {busy === a.id ? <Loader2 className="size-3 animate-spin" /> : "حفظ"}
                </button>
                <button onClick={() => setEditId(null)} className="px-3 py-2 rounded-xl bg-surface-2 text-xs text-foreground">
                  إلغاء
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// ========== Books List ==========
function BooksList() {
  const qc = useQueryClient();
  const books = useQuery({ queryKey: ["books"], queryFn: fetchBooks });
  const list = books.data ?? [];
  return (
    <div className="space-y-2 mb-4">
      {!books.isLoading && list.length === 0 && (
        <Card className="text-center text-xs text-muted-foreground py-4">لم تُرفع كتب بعد.</Card>
      )}
      {list.map((b) => (
        <Card key={b.id} className="!p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-foreground truncate">{b.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">{b.subject ?? "—"} · {b.grade ?? "عام"}</div>
          </div>
          <button
            onClick={async () => {
              await deleteBook(b);
              qc.invalidateQueries({ queryKey: ["books"] });
              qc.invalidateQueries({ queryKey: ["admin-stats"] });
            }}
            className="size-8 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}

// ========== Composers ==========
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
    <ComposerShell icon={<Megaphone className="size-4" />} label="إنشاء تبليغ" open={open} onToggle={() => setOpen((o) => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <SmInput value={title} onChange={setTitle} placeholder="العنوان" required />
        <SmTextArea value={body} onChange={setBody} placeholder="نص التبليغ" required rows={3} />
        <label className="flex items-center gap-2 text-xs text-foreground">
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
    <ComposerShell icon={<Newspaper className="size-4" />} label="إضافة خبر" open={open} onToggle={() => setOpen((o) => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <SmInput value={title} onChange={setTitle} placeholder="العنوان" required />
        <SmTextArea value={body} onChange={setBody} placeholder="تفاصيل الخبر" required rows={3} />
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
      await createEvent({ title, description, location: location || undefined, starts_at: startsAt ? new Date(startsAt).toISOString() : undefined });
      setTitle(""); setDescription(""); setLocation(""); setStartsAt(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally { setBusy(false); }
  }
  return (
    <ComposerShell icon={<CalendarPlus className="size-4" />} label="إضافة فعالية" open={open} onToggle={() => setOpen((o) => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <SmInput value={title} onChange={setTitle} placeholder="عنوان الفعالية" required />
        <SmTextArea value={description} onChange={setDescription} placeholder="وصف" rows={2} />
        <SmInput value={location} onChange={setLocation} placeholder="المكان" />
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-foreground" />
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
    } catch (e: any) { setErr(e?.message ?? "تعذّر الحفظ"); }
    finally { setBusy(false); }
  }

  return (
    <ComposerShell icon={<GraduationCap className="size-4" />} label="إضافة درجة لطالب" open={open} onToggle={() => setOpen((o) => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-foreground">
          <option value="">— اختر الطالب —</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name} {s.student_id ? `(${s.student_id})` : ""}</option>
          ))}
        </select>
        <SmInput value={subject} onChange={setSubject} placeholder="المادة" required />
        <SmInput value={score} onChange={setScore} placeholder="الدرجة من 100" required />
        <SmInput value={term} onChange={setTerm} placeholder="الفصل" />
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
    } catch (e: any) { setErr(e?.message ?? "تعذّر رفع الكتاب"); }
    finally { setBusy(false); }
  }

  return (
    <ComposerShell icon={<BookPlus className="size-4" />} label="رفع كتاب" open={open} onToggle={() => setOpen((o) => !o)}>
      <form onSubmit={submit} className="space-y-2">
        <SmInput value={title} onChange={setTitle} placeholder="عنوان الكتاب" required />
        <SmInput value={subject} onChange={setSubject} placeholder="المادة (اختياري)" />
        <SmInput value={grade} onChange={setGrade} placeholder="الصف (اختياري)" />
        <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs text-foreground" />
        {err && <div className="text-[11px] text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center font-bold">{err}</div>}
        <SubmitBtn busy={busy} label="رفع ونشر" />
      </form>
    </ComposerShell>
  );
}

// ========== Shared helpers ==========
function SmInput({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-foreground" />
  );
}
function SmTextArea({ value, onChange, placeholder, required, rows }: { value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} rows={rows ?? 3}
      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-foreground resize-none" />
  );
}
function ComposerShell({ icon, label, open, onToggle, children }: { icon: React.ReactNode; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Card className="!p-3 mb-2.5">
      <button onClick={onToggle} className="flex items-center gap-3 w-full text-right">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
        <div className="font-bold text-sm flex-1 text-foreground">{label}</div>
        <Plus className={`size-4 text-muted-foreground transition ${open ? "rotate-45" : ""}`} />
      </button>
      {open && <div className="mt-3 pt-3 border-t border-border">{children}</div>}
    </Card>
  );
}
function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy}
      className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </button>
  );
}
function Spinner() {
  return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
}
