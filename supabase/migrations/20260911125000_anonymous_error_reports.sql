alter table public.ai_reports
  alter column user_id drop not null;

comment on column public.ai_reports.user_id is 'User who submitted the report; null is allowed only for automatic anonymous error reports';
