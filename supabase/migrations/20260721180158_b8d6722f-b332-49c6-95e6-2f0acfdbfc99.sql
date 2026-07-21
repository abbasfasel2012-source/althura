
alter table public.profiles
  add column if not exists is_teacher boolean not null default false,
  add column if not exists teaching_grade text,
  add column if not exists teaching_section text,
  add column if not exists teaching_subject text,
  add column if not exists phone text,
  add column if not exists bio text;

drop policy if exists "profiles_read_all_authenticated" on public.profiles;
create policy "profiles_read_all_authenticated" on public.profiles
  for select to authenticated using (true);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.direct_messages to authenticated;
grant all on public.direct_messages to service_role;

alter table public.direct_messages enable row level security;

drop policy if exists "dm_participants_select" on public.direct_messages;
create policy "dm_participants_select" on public.direct_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "dm_sender_insert" on public.direct_messages;
create policy "dm_sender_insert" on public.direct_messages
  for insert to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "dm_participants_update_read" on public.direct_messages;
create policy "dm_participants_update_read" on public.direct_messages
  for update to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "dm_sender_delete" on public.direct_messages;
create policy "dm_sender_delete" on public.direct_messages
  for delete to authenticated
  using (auth.uid() = sender_id);

create index if not exists direct_messages_thread_idx on public.direct_messages (
  least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at desc
);
