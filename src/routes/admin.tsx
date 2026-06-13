import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { ChartBar, Image as ImageIcon, KeyRound, UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | لوحة التحكم" },
      { name: "description", content: "لوحة المالك لإدارة المنصة." },
    ],
  }),
  component: AdminPage,
});

const STATS = [
  { label: "الطلاب", value: "٣١٢", trend: "+٤" },
  { label: "طلبات", value: "٠٧", trend: "جديد" },
  { label: "تبليغات", value: "٢٤", trend: "هذا الشهر" },
  { label: "كتب", value: "١٢", trend: "متاح" },
];

const ACTIONS = [
  { label: "طلبات التسجيل", icon: UserPlus, count: 7 },
  { label: "المستخدمون", icon: Users, count: 312 },
  { label: "صور الموقع", icon: ImageIcon, count: 18 },
  { label: "مفتاح عبوسي", icon: KeyRound, count: null },
];

function AdminPage() {
  return (
    <AppShell title="لوحة التحكم">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          المالك
        </div>
        <h1 className="text-2xl font-bold">مرحباً بك في الإدارة</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {STATS.map((s, i) => (
          <Card key={i} className={i === 0 ? "bg-accent text-accent-foreground" : ""}>
            <div className={`text-[11px] ${i === 0 ? "opacity-70" : "text-muted-foreground"}`}>
              {s.label}
            </div>
            <div className="text-3xl font-mono font-bold mt-1">{s.value}</div>
            <div className={`text-[10px] mt-1 ${i === 0 ? "opacity-70" : "text-primary"} font-bold`}>
              {s.trend}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle eyebrow="إجراءات" title="إدارة المنصة" />
      <div className="space-y-2.5">
        {ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <Card key={i} className="!p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{a.label}</div>
                </div>
                {a.count != null && (
                  <div className="font-mono font-bold text-accent">{a.count}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle eyebrow="نظرة عامة" title="نشاط الأسبوع" />
      <Card className="h-40 flex items-end justify-around gap-2 !p-4">
        {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-primary/70"
              style={{ height: `${h}%` }}
            />
            <div className="text-[9px] font-mono text-muted-foreground">{i + 1}</div>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}
