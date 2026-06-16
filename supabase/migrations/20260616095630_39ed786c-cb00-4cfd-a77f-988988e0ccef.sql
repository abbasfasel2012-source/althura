
-- علاقة messages -> profiles (لتفعيل join في PostgREST)
ALTER TABLE public.messages
  ADD CONSTRAINT messages_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- الواجبات
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own homework" ON public.homework FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin sees all homework" ON public.homework FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- تشديد سياسة طلبات التسجيل (إزالة WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can request" ON public.pending_registrations;
CREATE POLICY "Anyone can request" ON public.pending_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND length(full_name) > 0 AND length(student_id) > 0);
