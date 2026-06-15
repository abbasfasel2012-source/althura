-- ============ FIX: Groups, Members, Messages (safe re-run) ============

-- Drop old tables if they exist (cascade) to redo cleanly
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;

-- ============ GROUPS ============
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ GROUP MEMBERS ============
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ RLS ============

-- GROUPS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_authenticated" ON public.groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups_all_admin" ON public.groups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- GROUP MEMBERS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_select_all" ON public.group_members
  FOR SELECT TO authenticated USING (true);
-- Any authenticated user can join themselves
CREATE POLICY "gm_insert_self" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gm_delete_self" ON public.group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gm_all_admin" ON public.group_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- MESSAGES: authenticated users can read all messages in groups
-- and insert messages (join happens automatically in app code)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_authenticated" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "msg_insert_authenticated" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "msg_all_admin" ON public.messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.groups TO service_role;
GRANT ALL ON public.group_members TO service_role;
GRANT ALL ON public.messages TO service_role;

-- ============ SEED GROUPS ============
INSERT INTO public.groups (name, description) VALUES
  ('كروب الصف السادس — أ', 'المجموعة الرسمية لطلاب الصف السادس الشعبة أ'),
  ('كروب الفيزياء', 'نقاشات حول مادة الفيزياء المتقدمة'),
  ('كروب عام — الذرى', 'المجموعة العامة لجميع طلاب المدرسة');
