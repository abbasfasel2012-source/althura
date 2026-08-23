-- المرحلة ٤ من نظام المدارس المتعددة: دعوة مديرين جدد.
-- طُبّق مباشرة على قاعدة البيانات الحية، هذا الملف يوثّقه.

CREATE TABLE public.manager_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  school_id uuid references public.schools(id) on delete set null,
  invited_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

ALTER TABLE public.manager_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_invites_super_owner_only" ON public.manager_invites
FOR ALL
USING (app_hidden.is_super_owner(auth.uid()))
WITH CHECK (app_hidden.is_super_owner(auth.uid()));

-- تحديث دالة إنشاء الحسابات الجديدة: لو الإيميل موجود بجدول الدعوات
-- (ولسا ما استُخدم)، يصير الحساب admin مربوط بالمدرسة المحدّدة بالدعوة
-- تلقائياً — بدل ما يصير طالب عادي. حساب عباس الأصلي يبقى بنفس السلوك
-- القديم بالضبط (admin، مربوط بمدرسة الذرى).
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
BEGIN
  SELECT * INTO v_invite FROM public.manager_invites
    WHERE lower(email) = lower(NEW.email) AND used_at IS NULL
    LIMIT 1;

  IF NEW.email = 'abbasfasel2012@gmail.com' THEN
    v_role := 'admin';
    v_school_id := (SELECT id FROM public.schools WHERE code = '0001');
  ELSIF v_invite.id IS NOT NULL THEN
    v_role := 'admin';
    v_school_id := v_invite.school_id;
    UPDATE public.manager_invites SET used_at = now() WHERE id = v_invite.id;
  ELSE
    v_role := 'student';
    v_school_id := NULL;
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
