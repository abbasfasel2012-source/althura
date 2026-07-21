import { useQuery } from "@tanstack/react-query";
import { fetchProfileById } from "@/lib/data";
import { Loader2, X, Mail, Phone, GraduationCap, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function ProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { userId: me } = useAuth();
  const q = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfileById(userId) });
  const p = q.data;
  const isSelf = me === userId;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-strong rounded-3xl p-6 relative shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 size-8 grid place-items-center rounded-xl bg-surface-2 text-muted-foreground"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>

        {q.isLoading || !p ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="text-center">
              <div className="size-20 mx-auto rounded-3xl bg-accent text-accent-foreground grid place-items-center text-2xl font-bold mb-3">
                {p.full_name?.[0] ?? "؟"}
              </div>
              <h3 className="text-lg font-bold">{p.full_name}</h3>
              <div className="text-[11px] text-primary font-bold mt-1">
                {p.is_teacher
                  ? (p.teaching_subject ? `مدرّس ${p.teaching_subject}` : "مدرّس")
                  : p.admin_label
                  ? p.admin_label
                  : p.student_id
                  ? `طالب — ${p.student_id}`
                  : "عضو"}
              </div>
              {p.grade && !p.is_teacher && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  الصف {p.grade}{p.section ? ` / ${p.section}` : ""}
                </div>
              )}
              {p.is_teacher && (p.teaching_grade || p.teaching_section) && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {p.teaching_grade ? `الصف ${p.teaching_grade}` : "كل الصفوف"}
                  {p.teaching_section ? ` / ${p.teaching_section}` : ""}
                </div>
              )}
            </div>

            {p.bio && (
              <div className="mt-4 glass rounded-2xl p-3 text-[12px] leading-relaxed text-foreground/80">
                {p.bio}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 text-sm">
                  <Phone className="size-4 text-primary" />
                  <span dir="ltr" className="font-mono">{p.phone}</span>
                </a>
              )}
              {p.email && !p.email.endsWith("@aladhra.school") && (
                <a href={`mailto:${p.email}`} className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 text-sm">
                  <Mail className="size-4 text-primary" />
                  <span dir="ltr" className="truncate">{p.email}</span>
                </a>
              )}
              {p.grade && !p.is_teacher && (
                <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 text-sm">
                  <GraduationCap className="size-4 text-primary" />
                  <span>الصف {p.grade}{p.section ? ` / ${p.section}` : ""}</span>
                </div>
              )}
            </div>

            {!isSelf && me && (
              <Link
                to="/dm/$userId"
                params={{ userId: p.id }}
                onClick={onClose}
                className="mt-4 w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                محادثة خاصة
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
