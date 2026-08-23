-- ربط طلبات تسجيل الطلاب بالمدرسة اللي سجّلوا فيها فعلياً، بدل ما
-- كل الحسابات الجديدة تُربط تلقائياً بمدرسة الذرى فقط.

ALTER TABLE public.pending_registrations ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
UPDATE public.pending_registrations SET school_id = (SELECT id FROM public.schools WHERE code = '0001') WHERE school_id IS NULL;

-- الدالة تقرأ الآن school_id من بيانات المستخدم الممرَّرة وقت الموافقة
-- (بدل ما تفترض دايماً مدرسة الذرى للطلاب الجدد).
CREATE OR REPLACE FUNCTION app_hidden.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_invite record;
  v_school_id uuid;
  v_meta_school_id uuid;
BEGIN
  SELECT * INTO v_invite FROM public.manager_invites
    WHERE lower(email) = lower(NEW.email) AND used_at IS NULL
    LIMIT 1;

  v_meta_school_id := NULLIF(NEW.raw_user_meta_data->>'school_id', '')::uuid;

  IF NEW.email = 'abbasfasel2012@gmail.com' THEN
    v_role := 'admin';
    v_school_id := (SELECT id FROM public.schools WHERE code = '0001');
  ELSIF v_invite.id IS NOT NULL THEN
    v_role := 'admin';
    v_school_id := v_invite.school_id;
    UPDATE public.manager_invites SET used_at = now() WHERE id = v_invite.id;
  ELSE
    v_role := 'student';
    v_school_id := v_meta_school_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, student_id, grade, section, email, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_invite.full_name, ''),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE(NEW.raw_user_meta_data->>'grade', '6'),
    NEW.raw_user_meta_data->>'section',
    NEW.email,
    COALESCE(v_school_id, (SELECT id FROM public.schools WHERE code = '0001'))
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$function$;
