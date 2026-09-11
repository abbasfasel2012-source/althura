create table if not exists public.agent_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.agent_reminders enable row level security;
create policy "own agent reminders" on public.agent_reminders for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.agent_reminders to authenticated;
grant all on public.agent_reminders to service_role;
