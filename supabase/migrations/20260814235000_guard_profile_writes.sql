-- حرج: كانت RLS تسمح للمستخدم يعدّل صفه الدراسي (grade/section) أو يجعل
-- نفسه معلّم (is_teacher) بالكامل بدون أي قيد على الأعمدة — و
-- can_access_grade_section() يثق بـ profiles.grade/section مباشرة، يعني
-- أي طالب يقدر يوصل لأي صف/شعبة ثانية بمجرد تعديل صفه بنفسه.
-- (مطبّق مسبقاً على القاعدة الحية بتاريخ اليوم؛ هذا الملف يوثّقه بتاريخ migrations.)
CREATE OR REPLACE FUNCTION app_hidden.guard_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_hidden
AS $$
BEGIN
  IF auth.role() = 'service_role' OR app_hidden.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.grade IS DISTINCT FROM OLD.grade
     OR NEW.section IS DISTINCT FROM OLD.section
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.is_teacher IS DISTINCT FROM OLD.is_teacher
     OR NEW.teaching_grade IS DISTINCT FROM OLD.teaching_grade
     OR NEW.teaching_section IS DISTINCT FROM OLD.teaching_section
     OR NEW.teaching_subject IS DISTINCT FROM OLD.teaching_subject
     OR NEW.admin_label IS DISTINCT FROM OLD.admin_label THEN
    RAISE EXCEPTION 'هذا الحقل يتطلب صلاحية إدارية';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_write ON public.profiles;
CREATE TRIGGER guard_profile_write
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION app_hidden.guard_profile_write();

-- الانضمام الذاتي لمجموعة يقتصر على المجموعات العامة فقط (defense in depth —
-- الواجهة أصلاً تخفي معرّفات المجموعات الخاصة عن غير الأعضاء، لكن ما فيه
-- فرض حقيقي بقاعدة البيانات كان موجود سابقاً).
DROP POLICY IF EXISTS "Join groups" ON public.group_members;
CREATE POLICY "Join groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      app_hidden.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_private = false)
    )
  );
