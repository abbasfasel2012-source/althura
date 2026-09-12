create extension if not exists vector;

alter table public.books add column if not exists indexing_status text not null default 'pending';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='books_indexing_status_check') then
    alter table public.books add constraint books_indexing_status_check check (indexing_status in ('pending','processing','ready','failed'));
  end if;
end $$;
alter table public.books add column if not exists indexing_error text;

create table if not exists public.book_chunks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  content text not null,
  page_number integer,
  chunk_index integer not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now(),
  unique (book_id, chunk_index)
);
create index if not exists book_chunks_embedding_idx on public.book_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists book_chunks_book_id_idx on public.book_chunks(book_id);
alter table public.book_chunks enable row level security;
grant select on public.book_chunks to authenticated;
grant all on public.book_chunks to service_role;
drop policy if exists "book_chunks_read_authenticated" on public.book_chunks;
create policy "book_chunks_read_authenticated" on public.book_chunks for select to authenticated using (true);

drop function if exists public.search_book_chunks(vector(768), integer, text, text);
create or replace function public.search_book_chunks(
  query_embedding vector(768),
  match_count integer default 6,
  requested_grade text default null,
  requested_subject text default null
)
returns table (content text, page_number integer, title text, grade text, subject text, similarity real)
language sql stable security invoker
set search_path = public
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
grant execute on function public.search_book_chunks(vector(768), integer, text, text) to authenticated, service_role;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_deleted_at timestamptz,
  owner_deleted_at timestamptz
);
create table if not exists public.ai_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.ai_action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','failed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz
);
create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  title text not null,
  description text not null,
  conversation_snapshot jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_by uuid not null references auth.users(id),
  reason text,
  blocked_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_conversation_messages(conversation_id, created_at);
create index if not exists ai_reports_created_idx on public.ai_reports(created_at desc);
create index if not exists user_blocks_active_idx on public.user_blocks(user_id, blocked_until);

alter table public.ai_conversations enable row level security;
alter table public.ai_conversation_messages enable row level security;
alter table public.ai_action_requests enable row level security;
alter table public.ai_reports enable row level security;
alter table public.user_blocks enable row level security;

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_conversation_messages to authenticated;
grant select, insert, update on public.ai_action_requests to authenticated;
grant select, insert on public.ai_reports to authenticated;
grant select, insert, update, delete on public.user_blocks to authenticated;

drop policy if exists "own ai conversations" on public.ai_conversations;
create policy "own ai conversations" on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own ai messages" on public.ai_conversation_messages;
create policy "own ai messages" on public.ai_conversation_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own ai actions" on public.ai_action_requests;
create policy "own ai actions" on public.ai_action_requests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own ai reports" on public.ai_reports;
create policy "own ai reports" on public.ai_reports for insert to authenticated with check (user_id = auth.uid() or user_id is null);
drop policy if exists "own ai reports read" on public.ai_reports;
create policy "own ai reports read" on public.ai_reports for select to authenticated using (user_id = auth.uid());
drop policy if exists "super owner reads reports" on public.ai_reports;
create policy "super owner reads reports" on public.ai_reports for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
drop policy if exists "super owner updates reports" on public.ai_reports;
create policy "super owner updates reports" on public.ai_reports for update to authenticated using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));
drop policy if exists "super owner manages blocks" on public.user_blocks;
create policy "super owner manages blocks" on public.user_blocks for all to authenticated using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  request text not null,
  plan jsonb not null default '[]'::jsonb,
  status text not null default 'awaiting_confirmation' check (status in ('awaiting_confirmation','running','completed','cancelled','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  step_index integer not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','cancelled')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  unique (run_id, step_index)
);
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;
alter table public.user_preferences enable row level security;
grant select, insert, update, delete on public.agent_runs to authenticated;
grant select on public.agent_steps to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
drop policy if exists "own agent runs" on public.agent_runs;
create policy "own agent runs" on public.agent_runs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own agent steps" on public.agent_steps;
create policy "own agent steps" on public.agent_steps for select to authenticated using (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid()));
drop policy if exists "own preferences" on public.user_preferences;
create policy "own preferences" on public.user_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.agent_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  created_by uuid not null references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.agent_prompts enable row level security;
alter table public.agent_audit_log enable row level security;
grant select, insert, update, delete on public.agent_prompts to authenticated;
grant select on public.agent_audit_log to authenticated;
grant all on public.agent_prompts, public.agent_audit_log to service_role;
drop policy if exists "super owner manages agent prompts" on public.agent_prompts;
create policy "super owner manages agent prompts" on public.agent_prompts for all to authenticated using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));
drop policy if exists "super owner reads audit" on public.agent_audit_log;
create policy "super owner reads audit" on public.agent_audit_log for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
drop policy if exists "super owner reads all conversations" on public.ai_conversations;
create policy "super owner reads all conversations" on public.ai_conversations for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
drop policy if exists "super owner reads all ai messages" on public.ai_conversation_messages;
create policy "super owner reads all ai messages" on public.ai_conversation_messages for select to authenticated using (app_hidden.is_super_owner(auth.uid()));

create table if not exists public.agent_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  note text,
  done boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.agent_reminders enable row level security;
grant select, insert, update, delete on public.agent_reminders to authenticated;
grant all on public.agent_reminders to service_role;
drop policy if exists "own agent reminders" on public.agent_reminders;
create policy "own agent reminders" on public.agent_reminders for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists agent_reminders_due_idx on public.agent_reminders(user_id, remind_at) where done = false;

grant all on all tables in schema public to service_role;

do $$
begin
  if exists (select 1 from pg_class where relname = 'direct_messages' and relnamespace = 'public'::regnamespace)
     and not exists (
       select 1 from pg_publication_rel pr
       join pg_class c on c.oid = pr.prrelid
       join pg_publication p on p.oid = pr.prpubid
       where p.pubname = 'supabase_realtime' and c.relname = 'direct_messages' and c.relnamespace = 'public'::regnamespace
     ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end
$$;