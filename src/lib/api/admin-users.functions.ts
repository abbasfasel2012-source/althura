import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("تعذّر التحقق من الصلاحيات");
  if (!data) throw new Error("هذا الإجراء متاح للمالك فقط");
}

// Reset a user's password (owner-only).
export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      newPassword: z.string().min(6, "الحد الأدنى 6 محارف"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Promote/demote teacher (owner-only). Also sets teaching_grade/section.
export const setTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      isTeacher: z.boolean(),
      teachingGrade: z.string().nullable().optional(),
      teachingSection: z.string().nullable().optional(),
      teachingSubject: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        is_teacher: data.isTeacher,
        teaching_grade: data.teachingGrade ?? null,
        teaching_section: data.teachingSection ?? null,
        teaching_subject: data.teachingSubject ?? null,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
