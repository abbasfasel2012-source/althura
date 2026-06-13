import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { ACHIEVEMENTS, GRADE_NAMES, STUDENT_STATS, ar, setUser, useUser } from "@/lib/store";
import { ChevronLeft, GraduationCap, LogOut, Settings, Shield, Trophy } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | حسابي" },
      { name: "description", content: "بياناتك الشخصية، إنجازاتك، وإعداداتك." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useUser();
  const navigate = useNavigate();

  if (!user) {
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

  const initial = user.fullName?.[0] ?? "ط";

  return (
    <AppShell title="حسابي">
      <Card className="animate-reveal text-center">
        <div className="size-20 rounded-3xl bg-accent text-accent-foreground grid place-items-center text-3xl font-bold mx-auto mb-3 shadow-glass">
          {initial}
        </div>
        <div className="font-bold text-lg">{user.fullName}</div>
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mt-1">
          {GRADE_NAMES[user.grade]} {user.section ? `• شعبة ${user.section}` : ""}
        </div>
        <div className="mt-2 inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
          {user.role === "owner" ? "المالك" : user.role === "guest" ? "زائر" : "طالب"}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
          <S label="المعدل" value={ar(STUDENT_STATS.average.toFixed(0)) + "٪"} />
          <S label="الترتيب" value={`#${ar(STUDENT_STATS.rank)}`} />
          <S label="حضور" value={`${ar(STUDENT_STATS.attendance)}٪`} />
        </div>
      </Card>

      <SectionTitle eyebrow="الإنجازات" title="شارات وأوسمة" />
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {ACHIEVEMENTS.map((a, i) => (
          <Card key={i} className={`!p-3 text-center ${a.unlocked ? "" : "opacity-40"}`}>
            <div className="text-3xl mb-1">{a.icon}</div>
            <div className="font-bold text-xs">{a.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{a.desc}</div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <PL to="/grades" icon={<GraduationCap className="size-4 text-primary" />} label="درجاتي" />
        <PL to="/calendar" icon={<Trophy className="size-4 text-primary" />} label="التقويم" />
        {user.role === "owner" && (
          <PL to="/admin" icon={<Shield className="size-4 text-primary" />} label="لوحة التحكم" />
        )}
        <PL to="/settings" icon={<Settings className="size-4 text-primary" />} label="الإعدادات" />
        <button
          onClick={() => { setUser(null); navigate({ to: "/login" }); }}
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
