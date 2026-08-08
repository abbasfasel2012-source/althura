
CREATE SCHEMA IF NOT EXISTS app_hidden;
GRANT USAGE ON SCHEMA app_hidden TO authenticated, anon, service_role;

-- Move SECURITY DEFINER helpers/triggers out of the exposed public API schema.
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA app_hidden;
ALTER FUNCTION public.can_access_grade_section(text, text) SET SCHEMA app_hidden;
ALTER FUNCTION public.check_dm_not_blocked() SET SCHEMA app_hidden;
ALTER FUNCTION public.handle_new_user() SET SCHEMA app_hidden;
ALTER FUNCTION public.set_updated_at() SET SCHEMA app_hidden;

REVOKE ALL ON FUNCTION app_hidden.check_dm_not_blocked() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_hidden.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_hidden.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_hidden.can_access_grade_section(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_hidden.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Shared-context helpers (SECURITY DEFINER, hidden schema)
CREATE OR REPLACE FUNCTION app_hidden.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = _group_id AND gm.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION app_hidden.shares_context(_target uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    _viewer IS NOT NULL AND (
      _target = _viewer
      OR app_hidden.has_role(_viewer, 'admin'::public.app_role)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _target AND p.is_teacher)
      OR EXISTS (
        SELECT 1 FROM public.group_members a
        JOIN public.group_members b ON b.group_id = a.group_id
        WHERE a.user_id = _viewer AND b.user_id = _target
      )
      OR EXISTS (
        SELECT 1 FROM public.direct_messages d
        WHERE (d.sender_id = _viewer AND d.receiver_id = _target)
           OR (d.sender_id = _target AND d.receiver_id = _viewer)
      )
    )
$$;

REVOKE ALL ON FUNCTION app_hidden.is_group_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_hidden.shares_context(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_hidden.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_hidden.shares_context(uuid, uuid) TO authenticated;

-- profiles: no more blanket read
DROP POLICY IF EXISTS "profiles_read_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_related" ON public.profiles
FOR SELECT TO authenticated
USING (app_hidden.shares_context(id, auth.uid()));

-- message_reactions: only group members / admins
DROP POLICY IF EXISTS "read reactions" ON public.message_reactions;
CREATE POLICY "read reactions" ON public.message_reactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND (
        app_hidden.is_group_member(m.group_id, auth.uid())
        OR app_hidden.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

-- chat-media: only uploader, admins, or people sharing a conversation with the uploader
DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (
    owner = auth.uid()
    OR app_hidden.has_role(auth.uid(), 'admin'::public.app_role)
    OR app_hidden.shares_context(NULLIF(split_part(name, '/', 1), '')::uuid, auth.uid())
  )
);
