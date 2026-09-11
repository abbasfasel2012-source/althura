alter table public.agent_reminders add column if not exists notified_at timestamptz;
create index if not exists agent_reminders_due_idx on public.agent_reminders(user_id, remind_at) where done = false;
