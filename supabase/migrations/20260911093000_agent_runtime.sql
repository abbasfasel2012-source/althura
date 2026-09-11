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
create policy "own agent runs" on public.agent_runs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own agent steps" on public.agent_steps for select to authenticated using (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid()));
create policy "own preferences" on public.user_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.agent_runs to authenticated;
grant select on public.agent_steps to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant all on all tables in schema public to service_role;
