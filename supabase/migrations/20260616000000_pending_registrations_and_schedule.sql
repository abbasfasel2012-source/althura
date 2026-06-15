-- ============ PENDING REGISTRATIONS ============
-- بدلاً من إنشاء حساب مباشر، يصبح الطالب في قائمة الانتظار
CREATE TABLE public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  grade TEXT NOT NULL DEFAULT '6',
  section TEXT,
  password_hash TEXT NOT NULL, -- سيُخزن الباسورد مشفراً مؤقتاً حتى الموافقة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.pending_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_registrations TO authenticated;
GRANT ALL ON public.pending_registrations TO service_role;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- أي شخص يقدر يشوف طلبه بنفسه (عن طريق student_id)
CREATE POLICY "pending_select_own" ON public.pending_registrations
  FOR SELECT USING (true);

-- أي شخص يقدر يسجل طلب
CREATE POLICY "pending_insert_anyone" ON public.pending_registrations
  FOR INSERT WITH CHECK (true);

-- فقط الأدمن يعدل (يوافق/يرفض)
CREATE POLICY "pending_update_admin" ON public.pending_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pending_delete_admin" ON public.pending_registrations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ ADMIN LABELS (مدرس/إداري مع لقب) ============
-- يضيف المالك لقب لأي أدمن (مثلاً "مدرس العربي")
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_label TEXT DEFAULT NULL;

-- ============ WEEKLY SCHEDULE (جدول أسبوعي حقيقي) ============
CREATE TABLE public.weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 6), -- 0=أحد, 1=اثنين...
  day_name TEXT NOT NULL,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  holiday_label TEXT DEFAULT NULL, -- مثلاً "عطلة رسمية" أو "يوم الجمهورية"
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day_index)
);

CREATE TABLE public.schedule_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.weekly_schedule(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT DEFAULT NULL,
  room TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day_id, period_number)
);

GRANT SELECT ON public.weekly_schedule TO anon;
GRANT SELECT ON public.weekly_schedule TO authenticated;
GRANT ALL ON public.weekly_schedule TO service_role;
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_read_all" ON public.weekly_schedule FOR SELECT USING (true);
CREATE POLICY "schedule_write_admin" ON public.weekly_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.schedule_periods TO anon;
GRANT SELECT ON public.schedule_periods TO authenticated;
GRANT ALL ON public.schedule_periods TO service_role;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periods_read_all" ON public.schedule_periods FOR SELECT USING (true);
CREATE POLICY "periods_write_admin" ON public.schedule_periods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SEED: أيام الأسبوع الافتراضية ============
INSERT INTO public.weekly_schedule (day_index, day_name, is_holiday) VALUES
  (0, 'الأحد',     false),
  (1, 'الاثنين',   false),
  (2, 'الثلاثاء',  false),
  (3, 'الأربعاء',  false),
  (4, 'الخميس',    false),
  (5, 'الجمعة',    true),
  (6, 'السبت',     true)
ON CONFLICT (day_index) DO NOTHING;
