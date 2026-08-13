-- يمنع الطالب من تعديل محاولة اختبار بعد إرسالها (سبق تطبيقه مباشرة على
-- قاعدة البيانات الحية بتاريخ اليوم؛ هذا الملف يوثّقه بتاريخ migrations).
-- التصحيح الفعلي الآن يمر حصراً عبر submitQuizAttempt (service role).
CREATE OR REPLACE FUNCTION app_hidden.guard_quiz_attempt_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_hidden
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF app_hidden.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'attempt already submitted';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_quiz_attempt_write ON public.quiz_attempts;
CREATE TRIGGER guard_quiz_attempt_write
  BEFORE INSERT OR UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION app_hidden.guard_quiz_attempt_write();
