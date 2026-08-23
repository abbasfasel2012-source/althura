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

// Approve a pending student registration (owner-only). Creates the auth
// account server-side with the service-role key, then immediately clears
// password_hash so the plaintext password is never left sitting in the DB.
export const approvePendingRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ registrationId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reg, error: fetchErr } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("id", data.registrationId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!reg) throw new Error("الطلب غير موجود");
    if (reg.status !== "pending") throw new Error("تمت معالجة هذا الطلب مسبقاً");

    const email = `${reg.student_id.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@aladhra.school`;

    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: reg.password_hash,
      email_confirm: true,
      user_metadata: {
        full_name: reg.full_name,
        student_id: reg.student_id,
        grade: reg.grade,
        section: reg.section,
        school_id: reg.school_id,
      },
    });
    if (createErr && !/already registered|already exists/i.test(createErr.message ?? "")) {
      throw new Error(createErr.message);
    }

    const { error: updateErr } = await supabaseAdmin
      .from("pending_registrations")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        password_hash: "[cleared]", // الباسورد استُهلك — ما نخزنه نص صريح بعد الآن
      })
      .eq("id", data.registrationId);
    if (updateErr) throw new Error(updateErr.message);

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
