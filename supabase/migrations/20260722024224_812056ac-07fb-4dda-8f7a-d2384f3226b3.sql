
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS allow_media boolean NOT NULL DEFAULT true;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DROP POLICY IF EXISTS "Update own messages" ON public.messages;
CREATE POLICY "Update own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DROP POLICY IF EXISTS "dm_sender_update" ON public.direct_messages;
CREATE POLICY "dm_sender_update" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read reactions" ON public.message_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id)
  );
CREATE POLICY "insert own reactions" ON public.message_reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own reactions" ON public.message_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

CREATE TABLE IF NOT EXISTS public.dm_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.dm_reactions TO authenticated;
GRANT ALL ON public.dm_reactions TO service_role;
ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read dm reactions" ON public.dm_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.direct_messages d WHERE d.id = message_id
      AND (d.sender_id = auth.uid() OR d.receiver_id = auth.uid()))
  );
CREATE POLICY "insert own dm reactions" ON public.dm_reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own dm reactions" ON public.dm_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_reactions;

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage own blocks" ON public.blocked_users
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.check_dm_not_blocked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id
  ) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_dm_check_block ON public.direct_messages;
CREATE TRIGGER trg_dm_check_block BEFORE INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_dm_not_blocked();

DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media');
DROP POLICY IF EXISTS "chat_media_insert" ON storage.objects;
CREATE POLICY "chat_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND owner = auth.uid());
DROP POLICY IF EXISTS "chat_media_delete_own" ON storage.objects;
CREATE POLICY "chat_media_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND (owner = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)));
