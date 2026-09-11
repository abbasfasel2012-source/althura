alter table public.ai_conversations add column if not exists user_deleted_at timestamptz;
alter table public.ai_conversations add column if not exists owner_deleted_at timestamptz;

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
create policy "super owner manages agent prompts" on public.agent_prompts for all to authenticated using (app_hidden.is_super_owner(auth.uid())) with check (app_hidden.is_super_owner(auth.uid()));
create policy "super owner reads audit" on public.agent_audit_log for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
create policy "super owner reads all conversations" on public.ai_conversations for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
create policy "super owner reads all ai messages" on public.ai_conversation_messages for select to authenticated using (app_hidden.is_super_owner(auth.uid()));
grant select, insert, update, delete on public.agent_prompts to authenticated;
grant select on public.agent_audit_log to authenticated;
grant all on public.agent_prompts, public.agent_audit_log to service_role;
