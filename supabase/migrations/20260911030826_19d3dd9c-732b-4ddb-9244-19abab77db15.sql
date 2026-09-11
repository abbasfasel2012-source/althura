-- messages: only members / public groups / admins can post
DROP POLICY IF EXISTS "Send own messages" ON public.messages;
CREATE POLICY "Send own messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    app_hidden.has_role(auth.uid(), 'admin'::app_role)
    OR app_hidden.is_group_member(group_id, auth.uid())
    OR app_hidden.is_public_group(group_id)
  )
);

-- message_reactions: only on messages the user can access
DROP POLICY IF EXISTS "insert own reactions" ON public.message_reactions;
CREATE POLICY "insert own reactions" ON public.message_reactions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND (
        app_hidden.has_role(auth.uid(), 'admin'::app_role)
        OR app_hidden.is_group_member(m.group_id, auth.uid())
        OR app_hidden.is_public_group(m.group_id)
      )
  )
);

-- dm_reactions: only on direct messages the user participates in
DROP POLICY IF EXISTS "insert own dm reactions" ON public.dm_reactions;
CREATE POLICY "insert own dm reactions" ON public.dm_reactions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.direct_messages d
    WHERE d.id = dm_reactions.message_id
      AND (d.sender_id = auth.uid() OR d.receiver_id = auth.uid())
  )
);

-- quiz_attempts: quiz must be published and accessible to the student
DROP POLICY IF EXISTS "attempts own insert" ON public.quiz_attempts;
CREATE POLICY "attempts own insert" ON public.quiz_attempts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    app_hidden.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_attempts.quiz_id
        AND q.is_published
        AND app_hidden.can_access_grade_section(q.grade, q.section)
    )
  )
);