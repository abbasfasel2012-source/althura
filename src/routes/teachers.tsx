import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Phone, Mail, MessageCircle } from "lucide-react";
import { fetchTeacherProfiles } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { ProfileModal } from "@/components/ProfileModal";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المدرّسون" },
      { name: "description", content: "هيئة التدريس في ثانوية الذرى الذكية للمتميزين." },
    ],
  }),
  component: TeachersPage,
});

const COLORS = [
  "from-amber-200 to-orange-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-rose-200 to-pink-300",
  "from-violet-200 to-purple-300",
  "from-yellow-200 to-amber-300",
];

function TeachersPage() {
  const { profile, isOwner, userId } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);

  const grade = isOwner ? null : profile?.grade ?? null;
  const section = isOwner ? null : profile?.section ?? null;

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teacher-profiles", grade, section],
    queryFn: () => fetchTeacherProfiles({ grade, section }),
  });

  return (
    <AppShell title="المدرّسون">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">الكادر التعليمي</div>
        <h1 className="text-2xl font-bold">هيئة التدريس</h1>
        {!isOwner && grade && (
          <p className="text-xs text-muted-foreground mt-1">
            المدرّسون الخاصون بصفك {grade}{section ? ` / ${section}` : ""}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : teachers.length === 0 ? (
        <Card className="text-center py-10 text-sm text-muted-foreground">
          لا يوجد مدرّسون مسجّلون{!isOwner ? " لصفك" : ""} حالياً.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {teachers.map((t, i) => (
            <Card key={t.id} className="!p-4 text-center">
              <button
                onClick={() => setOpenId(t.id)}
                className={`size-14 mx-auto rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} grid place-items-center text-xl font-bold mb-2 shadow-glass`}
              >
                {t.full_name.split(" ")[1]?.[0] ?? t.full_name[0]}
              </button>
              <button onClick={() => setOpenId(t.id)} className="font-bold text-sm leading-tight block w-full">
                {t.full_name}
              </button>
              <div className="text-[11px] text-primary font-medium mt-1">
                {t.teaching_subject ?? t.admin_label ?? "مدرّس"}
              </div>
              {(t.teaching_grade || t.teaching_section) && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t.teaching_grade ? `الصف ${t.teaching_grade}` : "كل الصفوف"}
                  {t.teaching_section ? ` / ${t.teaching_section}` : ""}
                </div>
              )}

              <div className="flex justify-center gap-2 mt-2.5">
                {userId && userId !== t.id && (
                  <Link
                    to="/dm/$userId"
                    params={{ userId: t.id }}
                    className="size-7 rounded-lg bg-accent/15 text-accent grid place-items-center"
                    aria-label="محادثة"
                  >
                    <MessageCircle className="size-3.5" />
                  </Link>
                )}
                {t.phone && (
                  <a href={`tel:${t.phone}`} className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Phone className="size-3.5" />
                  </a>
                )}
                {t.email && !t.email.endsWith("@aladhra.school") && (
                  <a href={`mailto:${t.email}`} className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Mail className="size-3.5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {openId && <ProfileModal userId={openId} onClose={() => setOpenId(null)} />}
    </AppShell>
  );
}
