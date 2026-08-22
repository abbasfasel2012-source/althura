-- المرحلة ١ من نظام المدارس المتعددة — الأساس بقاعدة البيانات.
-- كل هذي التغييرات إضافية بالكامل (additive)، ما تغيّر أي سلوك أو صلاحية
-- موجودة حالياً — الذرى تستمر تشتغل بالضبط زي ما هي.

CREATE TABLE public.schools (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  subtitle text not null default '',
  governorate text not null default '',
  location text,
  logo_url text,
  contact_numbers text[] not null default '{}',
  admin_user_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TRIGGER schools_set_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION app_hidden.set_updated_at();

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- أي شخص يقدر يتحقق من رمز مدرسة، حتى قبل تسجيل الدخول (شاشة الدخول
-- تحتاج تتحقق من الرمز وتعرض اسم المدرسة قبل أي مصادقة).
CREATE POLICY "schools_public_lookup" ON public.schools
FOR SELECT
USING (is_active = true);

-- سياسة مؤقتة: التعديل الكامل بس لمن عنده دور admin. تُستبدل بسياسة
-- تعتمد على is_super_owner تحديداً بمرحلة قادمة (لما تُبنى واجهة إدارة
-- المدارس الكاملة).
CREATE POLICY "schools_admin_manage" ON public.schools
FOR ALL
USING (app_hidden.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (app_hidden.has_role(auth.uid(), 'admin'::app_role));

-- المدرسة الأولى: الذرى، بنفس بياناتها الحالية بالضبط.
INSERT INTO public.schools (code, name, subtitle, governorate, contact_numbers)
VALUES (
  '0001',
  'ثانوية الذرى الذكية للمتميزين',
  'تم إعدادها بواسطة عباس فاضل',
  'كربلاء المقدسة',
  '{}'
);

-- ربط كل الجداول اللي تحتاج عزل بمدرسة، وتوزيع كل البيانات الحالية
-- على مدرسة الذرى تلقائياً.
DO $$
DECLARE
  althura_id uuid;
  t text;
BEGIN
  SELECT id INTO althura_id FROM public.schools WHERE code = '0001';

  FOREACH t IN ARRAY ARRAY[
    'profiles','groups','homework','exams','quizzes','videos','books',
    'announcements','news','events','weekly_schedule','teachers',
    'grades_records','site_images'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id)', t);
    EXECUTE format('UPDATE public.%I SET school_id = %L WHERE school_id IS NULL', t, althura_id);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN school_id SET DEFAULT %L', t, althura_id);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN school_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_school_id ON public.%I (school_id)', t, t);
  END LOOP;
END $$;

-- المالك العام: يدخل أي مدرسة بكل صلاحياتها. علم منفصل عن app_role
-- (اللي بس فيه admin/student) عشان ما نغيّر منطق موجود يعتمد عليه.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_owner boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION app_hidden.is_super_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_super_owner FROM public.profiles WHERE id = _user_id), false);
$$;

CREATE OR REPLACE FUNCTION app_hidden.get_user_school(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id;
$$;

-- تفعيل صلاحية المالك العام على حساب عباس (مالك المنصة الحالي)،
-- وربطه كمدير رسمي لمدرسة الذرى.
UPDATE public.profiles SET is_super_owner = true
WHERE id = '48b133f5-14a8-4a23-aafb-d13ac9283b2c';

UPDATE public.schools SET admin_user_id = '48b133f5-14a8-4a23-aafb-d13ac9283b2c'
WHERE code = '0001';
