-- 1) teachers: authenticated only
DROP POLICY IF EXISTS "teachers readable by all" ON public.teachers;
CREATE POLICY "teachers readable by authenticated" ON public.teachers
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.teachers FROM anon;

-- 2) schedule: authenticated only
DROP POLICY IF EXISTS "All can read schedule" ON public.weekly_schedule;
CREATE POLICY "Authenticated read schedule" ON public.weekly_schedule
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.weekly_schedule FROM anon;

DROP POLICY IF EXISTS "All can read periods" ON public.schedule_periods;
CREATE POLICY "Authenticated read periods" ON public.schedule_periods
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.schedule_periods FROM anon;

-- 3) public content stays browsable for guests, but internal account IDs are hidden from anon
REVOKE SELECT ON public.announcements FROM anon;
GRANT SELECT (id, title, body, pinned, created_at) ON public.announcements TO anon;

REVOKE SELECT ON public.news FROM anon;
GRANT SELECT (id, title, body, image_url, created_at) ON public.news TO anon;

REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (id, title, description, location, starts_at, created_at) ON public.events TO anon;

REVOKE SELECT ON public.books FROM anon;
GRANT SELECT (id, title, subject, grade, file_url, cover_url, created_at) ON public.books TO anon;

REVOKE SELECT ON public.exams FROM anon;
GRANT SELECT (id, title, subject, exam_date, description, created_at) ON public.exams TO anon;

REVOKE SELECT ON public.site_images FROM anon;
GRANT SELECT (id, slot, url, updated_at) ON public.site_images TO anon;

-- 4) storage: books require authentication
DROP POLICY IF EXISTS "storage_public_read_books" ON storage.objects;

-- 5) group memberships visible only within groups you belong to (or public groups); admins see all
CREATE OR REPLACE FUNCTION app_hidden.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = _group_id AND m.user_id = _user_id
  );
$$;
REVOKE ALL ON FUNCTION app_hidden.is_group_member(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_hidden.is_group_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "View memberships" ON public.group_members;
CREATE POLICY "View memberships" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR app_hidden.has_role(auth.uid(), 'admin'::app_role)
    OR app_hidden.is_group_member(group_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.is_private = false)
  );

-- 6) quiz correct answers are never readable from the browser
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, position, type, question, options, points, created_at)
  ON public.quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;