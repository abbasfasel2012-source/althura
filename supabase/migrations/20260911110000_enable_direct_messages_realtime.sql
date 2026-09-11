-- Deliver private messages immediately to both participants.
-- The conditional block keeps this migration safe on projects where the table
-- was already added to the realtime publication manually.
do $$
begin
  if exists (select 1 from pg_class where relname = 'direct_messages' and relnamespace = 'public'::regnamespace)
     and not exists (
       select 1
       from pg_publication_rel pr
       join pg_class c on c.oid = pr.prrelid
       join pg_publication p on p.oid = pr.prpubid
       where p.pubname = 'supabase_realtime'
         and c.relname = 'direct_messages'
         and c.relnamespace = 'public'::regnamespace
     ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end
$$;
