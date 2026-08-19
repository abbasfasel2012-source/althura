-- إصلاح "infinite recursion detected in policy for relation groups".
-- السبب: سياسة groups."Anyone can view public groups" كانت تستعلم مباشرة
-- عن group_members، وبنفس الوقت سياسة group_members."View memberships"
-- كانت تستعلم مباشرة عن groups — تسلسل دائري يخلي بوستغرس يفشل بمجرد
-- ما توصل لهذي الجداول.
--
-- الحل: دالة SECURITY DEFINER جديدة app_hidden.is_public_group() تكسر
-- الحلقة (نفس أسلوب app_hidden.is_group_member() الموجودة سابقاً)،
-- واستخدامها بدل الاستعلام المباشر بكل سياسة.

CREATE OR REPLACE FUNCTION app_hidden.is_public_group(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups WHERE id = _group_id AND is_private = false
  );
$$;

DROP POLICY IF EXISTS "Anyone can view public groups" ON public.groups;
CREATE POLICY "Anyone can view public groups" ON public.groups
FOR SELECT
USING (
  is_private = false
  OR app_hidden.has_role(auth.uid(), 'admin'::app_role)
  OR app_hidden.is_group_member(id, auth.uid())
);

DROP POLICY IF EXISTS "View memberships" ON public.group_members;
CREATE POLICY "View memberships" ON public.group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR app_hidden.has_role(auth.uid(), 'admin'::app_role)
  OR app_hidden.is_group_member(group_id, auth.uid())
  OR app_hidden.is_public_group(group_id)
);
