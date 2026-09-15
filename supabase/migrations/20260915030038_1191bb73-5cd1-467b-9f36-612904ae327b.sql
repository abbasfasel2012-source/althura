CREATE OR REPLACE FUNCTION app_hidden.can_access_grade_section(_grade text, _section text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app_hidden
AS $$
  SELECT
    app_hidden.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (_grade IS NULL OR p.grade = _grade)
        AND (_section IS NULL OR p.section = _section)
    )
$$;

REVOKE EXECUTE ON FUNCTION app_hidden.can_access_grade_section(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_hidden.can_access_grade_section(text, text) TO authenticated, service_role;