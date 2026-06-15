import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { GRADE_NAMES, useUser, type Grade } from "@/lib/store";
import { useAuth, signOut } from "@/lib/auth";
import { ar, fetchMyGrades } from "@/lib/data";
import { ChevronLeft, GraduationCap, LogOut, Settings, Shield, BookOpen } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | حسابي" },
      { name: "description", content: "بياناتك الشخصية الحقيقية ودرجاتك." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const localUser = useUser();
  const { userId, profile, isOwner, loading } = useAuth();
  const navigate = useNavigate();

  const grades = useQuery({
    queryKey: ["my-grades", userId],
    queryFn: () => fetchMyGrades(userId!),
    enabled: !!userId && !isOwner,
  });

  const avg =
    grades.data && grades.data.length > 0
      ? grades.data.reduce((s, g) => s + Number(g.score), 0) / grades.data.length
      : null;

  if (loading) {
    return <AppShell title="حسابي"><Card className="text-center py-10 text-xs text-muted-foreground">جاري التحميل…</Card></AppShell>;
  }

  if (!localUser && !userId) {
    return (
      <AppShell title="حسابي">
        <Card className="text-center py-10">
          <p className="text-sm text-muted-foreground mb-4">لم تسجّل الدخول بعد.</p>
          <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm">
            تسجيل الدخول
          </Link>
        </Card>
      </AppShell>
    );
  }

  const fullName = profile?.full_name || localUser?.fullName || "حساب";
  const gradeKey = (profile?.grade as Grade) || localUser?.grade || "general";
  const section = profile?.section || localUser?.section;
  const role: "owner" | "student" | "guest" =
    isOwner ? "owner" : userId ? "student" : "guest";
  const initial = fullName?.[0] ?? "ط";

  return (
    <AppShell title="حسابي">
      <Card className="animate-reveal text-center">
        <div className="size-20 rounded-3xl bg-accent text-accent-foreground grid place-items-center text-3xl font-bold mx-auto mb-3 shadow-glass">
          {initial}
        </div>
        <div className="font-bold text-lg">{fullName}</div>
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mt-1">
          {GRADE_NAMES[gradeKey]} {section ? `• شعبة ${section}` : ""}
        </div>
        {profile?.student_id && (
          <div className="font-mono text-[11px] text-muted-foreground mt-1">
            معرف الطالب: {profile.student_id}
          </div>
        )}
        <div className="mt-2 inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
          {role === "owner" ? "المالك" : role === "guest" ? "زائر" : "طالب"}
        </div>

        {role === "student" && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
            <S label="المعدل" value={avg !== null ? ar(avg.toFixed(0)) + "٪" : "—"} />
            <S label="المواد" value={ar(grades.data?.length ?? 0)} />
            <S label="الحالة" value={avg !== null && avg >= 50 ? "ناجح" : avg !== null ? "متعثر" : "—"} />
          </div>
        )}
      </Card>

      {role === "student" && grades.data && grades.data.length === 0 && (
        <Card className="mt-4 text-center text-xs text-muted-foreground py-5">
          لا توجد درجات مسجّلة بعد — ستظهر هنا فور إضافتها من قبل المالك.
        </Card>
      )}

      <SectionTitle eyebrow="الحساب" title="إدارة حسابك" />
      <div className="space-y-2">
        {role === "student" && (
          <PL to="/grades" icon={<GraduationCap className="size-4 text-primary" />} label="درجاتي" />
        )}
        <PL to="/books" icon={<BookOpen className="size-4 text-primary" />} label="المكتبة" />
        {isOwner && (
          <PL to="/admin" icon={<Shield className="size-4 text-primary" />} label="لوحة التحكم" />
        )}
        <PL to="/settings" icon={<Settings className="size-4 text-primary" />} label="الإعدادات" />
        <button
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
          className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 text-right hover:bg-surface-2 transition"
        >
          <LogOut className="size-4 text-destructive" />
          <span className="font-bold text-sm text-destructive flex-1">تسجيل الخروج</span>
        </button>
      </div>
    </AppShell>
  );
}

function S({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono font-bold text-base mt-0.5">{value}</div>
    </div>
  );
}

function PL({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-surface-2 transition">
      {icon}
      <span className="font-bold text-sm flex-1">{label}</span>
      <ChevronLeft className="size-4 text-muted-foreground" />
    </Link>
  );
}
