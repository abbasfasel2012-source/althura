
CREATE INDEX IF NOT EXISTS idx_messages_group_created ON public.messages (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_homework_user ON public.homework (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_periods_day ON public.schedule_periods (day_id, period_number);
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams (exam_date);

CREATE OR REPLACE FUNCTION public.home_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'books_count', (SELECT count(*) FROM public.books),
    'groups_count', (SELECT count(*) FROM public.groups),
    'students_count', (SELECT count(*) FROM public.profiles),
    'exams_upcoming', (SELECT count(*) FROM public.exams WHERE exam_date >= now()),
    'announcements', COALESCE((
      SELECT jsonb_agg(a) FROM (
        SELECT * FROM public.announcements ORDER BY pinned DESC, created_at DESC LIMIT 5
      ) a), '[]'::jsonb),
    'today_periods', COALESCE((
      SELECT jsonb_agg(p ORDER BY p.period_number) FROM public.schedule_periods p
      JOIN public.weekly_schedule w ON w.id = p.day_id
      WHERE w.day_index = EXTRACT(DOW FROM now())::int AND w.is_holiday = false
    ), '[]'::jsonb),
    'homework', COALESCE((
      SELECT jsonb_agg(h ORDER BY h.created_at DESC) FROM public.homework h
      WHERE h.user_id = auth.uid()
    ), '[]'::jsonb)
  )
$$;

CREATE OR REPLACE FUNCTION public.groups_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT g.*,
      (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id) AS members_count,
      (SELECT msg.content FROM public.messages msg
        WHERE msg.group_id = g.id AND msg.deleted_at IS NULL
        ORDER BY msg.created_at DESC LIMIT 1) AS last_message
    FROM public.groups g
  ) x
$$;

CREATE OR REPLACE FUNCTION public.latest_activity_at()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT max(t) FROM (
    SELECT max(created_at) AS t FROM public.announcements
    UNION ALL SELECT max(created_at) FROM public.news
    UNION ALL SELECT max(created_at) FROM public.events
  ) s
$$;

GRANT EXECUTE ON FUNCTION public.home_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.groups_overview() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.latest_activity_at() TO anon, authenticated;
