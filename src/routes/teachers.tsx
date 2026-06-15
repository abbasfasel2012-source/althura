import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Star, Phone, Mail } from "lucide-react";
import { ar } from "@/lib/data";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المدرّسون" },
      { name: "description", content: "هيئة التدريس في ثانوية الذرى الذكية." },
    ],
  }),
  component: TeachersPage,
});

interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  years_experience: number | null;
  created_at: string;
}

async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Teacher[];
}

const COLORS = [
  "from-amber-200 to-orange-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-rose-200 to-pink-300",
  "from-violet-200 to-purple-300",
  "from-yellow-200 to-amber-300",
];

function TeachersPage() {
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
  });

  if (isLoading) {
    return (
      <AppShell title="المدرّسون">
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="المدرّسون">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          الكادر التعليمي
        </div>
        <h1 className="text-2xl font-bold">هيئة التدريس</h1>
      </div>

      {teachers.length === 0 && (
        <Card className="text-center py-10 text-sm text-muted-foreground">
          لم يتم إضافة مدرّسين بعد.
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {teachers.map((t, i) => (
          <Card key={t.id} className="!p-4 text-center">
            <div className={`size-14 mx-auto rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} grid place-items-center text-xl font-bold mb-2 shadow-glass`}>
              {t.name.split(" ")[1]?.[0] ?? t.name[0]}
            </div>
            <div className="font-bold text-sm leading-tight">{t.name}</div>
            <div className="text-[11px] text-primary font-medium mt-1">{t.subject}</div>
            {t.years_experience && (
              <div className="text-[10px] text-muted-foreground mt-1">{ar(t.years_experience)} سنة خبرة</div>
            )}
            {t.bio && (
              <div className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{t.bio}</div>
            )}
            <div className="flex justify-center gap-2 mt-2">
              {t.phone && (
                <a href={`tel:${t.phone}`} className="size-7 rounded-lg bg-accent/10 text-accent grid place-items-center">
                  <Phone className="size-3.5" />
                </a>
              )}
              {t.email && (
                <a href={`mailto:${t.email}`} className="size-7 rounded-lg bg-accent/10 text-accent grid place-items-center">
                  <Mail className="size-3.5" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
