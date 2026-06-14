import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import {
  fetchAdminStats,
  fetchAnnouncements,
  createAnnouncement,
  createNews,
  createEvent,
  ar,
} from "@/lib/data";
import { useAuth, signOut } from "@/lib/auth";
import { CalendarPlus, Loader2, LogOut, Megaphone, Newspaper, Pin, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | لوحة التحكم" },
      { name: "description", content: "لوحة المالك لإدارة المنصة." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isOwner, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isOwner) {
      navigate({ to: "/login" });
    }
  }, [loading, isOwner, role, navigate]);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats, enabled: isOwner });
  const recent = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, enabled: isOwner });

  if (loading || !isOwner) {
    return (
      <AppShell title="لوحة التحكم">
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const cards = [
    { label: "الطلاب", value: stats.data?.students ?? 0, hl: true },
    { label: "تبليغات", value: stats.data?.announcements ?? 0 },
    { label: "أخبار", value: stats.data?.news ?? 0 },
    { label: "فعاليات", value: stats.data?.events ?? 0 },
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
            <div className={`text-[11px] ${s.hl ? "opacity-70" : "text-muted-foreground"}`}>
              {s.label}
            </div>
            <div className="text-3xl font-mono font-bold mt-1">{ar(s.value)}</div>
            <div className={`text-[10px] mt-1 ${s.hl ? "opacity-70" : "text-primary"} font-bold`}>
              {stats.isLoading ? "..." : "حالياً"}
            </div>
          </Card>
        ))}
      </div>

      <ComposerAnnouncement />
      <ComposerNews />
      <ComposerEvent />

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
        {recent.data && recent.data.length === 0 && (
          <Card className="text-center text-xs text-muted-foreground py-6">
            لا توجد تبليغات بعد — أنشئ أول تبليغ أعلاه.
          </Card>
        )}
        <Link to="/announcements" className="block text-center text-[11px] font-bold text-primary py-2">
          عرض الكل →
        </Link>
      </div>
    </AppShell>
  );
}

function ComposerAnnouncement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createAnnouncement({ title, body, pinned });
      setTitle(""); setBody(""); setPinned(false); setOpen(false);
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ComposerShell
      icon={<Megaphone className="size-4" />}
      label="إنشاء تبليغ جديد"
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      <form onSubmit={submit} className="space-y-2">
        <input
          required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="العنوان"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <textarea
          required value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="نص التبليغ" rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none"
        />
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createNews({ title, body });
      setTitle(""); setBody(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ComposerShell
      icon={<Newspaper className="size-4" />}
      label="إضافة خبر"
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      <form onSubmit={submit} className="space-y-2">
        <input
          required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="العنوان"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <textarea
          required value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="تفاصيل الخبر" rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none"
        />
        <SubmitBtn busy={busy} label="نشر الخبر" />
      </form>
    </ComposerShell>
  );
}

function ComposerEvent() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createEvent({
        title, description, location: location || undefined,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      });
      setTitle(""); setDescription(""); setLocation(""); setStartsAt(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ComposerShell
      icon={<CalendarPlus className="size-4" />}
      label="إضافة فعالية"
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      <form onSubmit={submit} className="space-y-2">
        <input
          required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الفعالية"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف" rows={2}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none"
        />
        <input
          value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="المكان"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <input
          type="datetime-local"
          value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
        />
        <SubmitBtn busy={busy} label="نشر الفعالية" />
      </form>
    </ComposerShell>
  );
}

function ComposerShell({
  icon, label, open, onToggle, children,
}: {
  icon: React.ReactNode; label: string; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="!p-3 mb-2.5">
      <button onClick={onToggle} className="flex items-center gap-3 w-full text-right">
        <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          {icon}
        </div>
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
      type="submit"
      disabled={busy}
      className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </button>
  );
}
