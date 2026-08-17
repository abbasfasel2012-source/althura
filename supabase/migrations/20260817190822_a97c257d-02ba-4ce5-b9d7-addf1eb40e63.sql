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
        SELECT id, title, body, pinned, created_at
        FROM public.announcements ORDER BY pinned DESC, created_at DESC LIMIT 5
      ) a), '[]'::jsonb),
    'today_periods', CASE WHEN auth.uid() IS NULL THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(p ORDER BY p.period_number) FROM public.schedule_periods p
      JOIN public.weekly_schedule w ON w.id = p.day_id
      WHERE w.day_index = EXTRACT(DOW FROM now())::int AND w.is_holiday = false
    ), '[]'::jsonb) END,
    'homework', COALESCE((
      SELECT jsonb_agg(h ORDER BY h.created_at DESC) FROM public.homework h
      WHERE h.user_id = auth.uid()
    ), '[]'::jsonb)
  )
$$;