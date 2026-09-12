-- 1) نقل إضافة vector خارج المخطط العام
create schema if not exists extensions;
grant usage on schema extensions to authenticated, anon, service_role;
alter extension vector set schema extensions;

create or replace function public.search_book_chunks(
  query_embedding extensions.vector(768),
  match_count integer default 6,
  requested_grade text default null,
  requested_subject text default null
)
returns table (content text, page_number integer, title text, grade text, subject text, similarity real)
language sql stable security invoker
set search_path = public, extensions
as $$
  select c.content, c.page_number, b.title, b.grade, b.subject,
    (1 - (c.embedding <=> query_embedding))::real as similarity
  from public.book_chunks c
  join public.books b on b.id = c.book_id
  where b.indexing_status = 'ready'
    and (requested_grade is null or b.grade is null or b.grade = requested_grade)
    and (requested_subject is null or b.subject is null or b.subject ilike requested_subject)
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 12));
$$;
grant execute on function public.search_book_chunks(extensions.vector(768), integer, text, text) to authenticated, service_role;

-- 2) أعمدة الصف/الشعبة
alter table public.weekly_schedule add column if not exists grade text;
alter table public.weekly_schedule add column if not exists section text;
alter table public.weekly_schedule drop constraint if exists weekly_schedule_day_index_key;
create unique index if not exists weekly_schedule_scope_day_idx
  on public.weekly_schedule (school_id, day_index, coalesce(grade, ''), coalesce(section, ''));

alter table public.exams add column if not exists grade text;
alter table public.exams add column if not exists section text;
alter table public.books add column if not exists section text;
alter table public.announcements add column if not exists grade text;
alter table public.announcements add column if not exists section text;

-- 3) سياسات القراءة حسب الصف/الشعبة
drop policy if exists "books_read_all" on public.books;
create policy "books_read_scoped" on public.books for select to authenticated
  using (app_hidden.can_access_grade_section(grade, section));

drop policy if exists "exams readable by all" on public.exams;
create policy "exams_read_scoped" on public.exams for select to authenticated
  using (app_hidden.can_access_grade_section(grade, section));

drop policy if exists "ann_read_all" on public.announcements;
create policy "ann_read_scoped" on public.announcements for select to authenticated
  using (app_hidden.can_access_grade_section(grade, section));

drop policy if exists "Authenticated read schedule" on public.weekly_schedule;
create policy "schedule_read_scoped" on public.weekly_schedule for select to authenticated
  using (app_hidden.can_access_grade_section(grade, section));

drop policy if exists "Authenticated read periods" on public.schedule_periods;
create policy "periods_read_scoped" on public.schedule_periods for select to authenticated
  using (exists (
    select 1 from public.weekly_schedule w
    where w.id = day_id and app_hidden.can_access_grade_section(w.grade, w.section)
  ));

-- 4) الملخص الرئيسي يحترم الصف/الشعبة
create or replace function public.home_summary()
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
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
$function$;