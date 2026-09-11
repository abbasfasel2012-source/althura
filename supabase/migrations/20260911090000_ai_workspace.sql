create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  user_id uuid not null references auth.users(id) on delete cascade,
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

create policy "own ai conversations" on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ai messages" on public.ai_conversation_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ai actions" on public.ai_action_requests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ai reports" on public.ai_reports for insert to authenticated with check (user_id = auth.uid());
create policy "own ai reports read" on public.ai_reports for select to authenticated using (user_id = auth.uid());

-- الشكاوى والحظر للمالك الأعلى فقط، وليس للمدير.
create policy "super owner reads reports" on public.ai_reports for select to authenticated
  using (app_hidden.is_super_owner(auth.uid()));
create policy "super owner updates reports" on public.ai_reports for update to authenticated
  using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));
create policy "super owner manages blocks" on public.user_blocks for all to authenticated
  using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_conversation_messages to authenticated;
grant select, insert, update on public.ai_action_requests to authenticated;
grant select, insert on public.ai_reports to authenticated;
grant select, insert, update, delete on public.user_blocks to authenticated;
grant all on all tables in schema public to service_role;
