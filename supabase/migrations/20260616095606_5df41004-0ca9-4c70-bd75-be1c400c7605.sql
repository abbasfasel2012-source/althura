
-- إضافة أعمدة ناقصة لجدول profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_label TEXT;

-- إضافة أعمدة ناقصة للكروبات والرسائل
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- طلبات التسجيل
CREATE TABLE public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  grade TEXT NOT NULL,
  section TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_registrations TO authenticated;
GRANT SELECT, INSERT ON public.pending_registrations TO anon;
GRANT ALL ON public.pending_registrations TO service_role;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request" ON public.pending_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage requests" ON public.pending_registrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- الجدول الأسبوعي
CREATE TABLE public.weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index INT NOT NULL UNIQUE,
  day_name TEXT NOT NULL,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  holiday_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_schedule TO anon, authenticated;
GRANT ALL ON public.weekly_schedule TO authenticated;
GRANT ALL ON public.weekly_schedule TO service_role;
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read schedule" ON public.weekly_schedule FOR SELECT USING (true);
CREATE POLICY "Admin writes schedule" ON public.weekly_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.weekly_schedule (day_index, day_name) VALUES
  (0,'الأحد'),(1,'الإثنين'),(2,'الثلاثاء'),(3,'الأربعاء'),(4,'الخميس'),(5,'الجمعة'),(6,'السبت');

-- الحصص
CREATE TABLE public.schedule_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.weekly_schedule(id) ON DELETE CASCADE,
  period_number INT NOT NULL,
  start_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day_id, period_number)
);
GRANT SELECT ON public.schedule_periods TO anon, authenticated;
GRANT ALL ON public.schedule_periods TO authenticated;
GRANT ALL ON public.schedule_periods TO service_role;
ALTER TABLE public.schedule_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read periods" ON public.schedule_periods FOR SELECT USING (true);
CREATE POLICY "Admin writes periods" ON public.schedule_periods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- تشديد صلاحيات الدوال (linter)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
