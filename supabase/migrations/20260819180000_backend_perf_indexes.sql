-- تحسينات أداء قاعدة البيانات — جزء من فحص الباكيند الشامل.
-- كل هذي التغييرات طُبّقت مباشرة على قاعدة البيانات الحية، وهذا الملف
-- يوثّقها بتاريخ المايغريشنز عشان تبقى متزامنة مع أي نسخة جديدة.

-- 1) فهرس مكرر بالضبط على group_members(group_id) بنفس التغطية —
--    يبطّئ كل عملية كتابة (انضمام لكروب، مغادرة) بدون أي فايدة، لأن
--    Postgres يحدّث الفهرسين معاً بكل INSERT/DELETE.
DROP INDEX IF EXISTS public.idx_members_group;

-- 2) quiz_attempts ما فيه أي فهرس غير المفتاح الأساسي. startOrGetAttempt
--    (يشتغل بكل مرة يفتح فيها طالب امتحان) يفلتر بـ (quiz_id, user_id) —
--    بدون فهرس هذا فحص كامل للجدول، ويتباطأ أكثر كل ما تتراكم المحاولات
--    خلال السنة الدراسية.
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user
  ON public.quiz_attempts (quiz_id, user_id, started_at DESC);

-- 3) fetchConversations (تستخدمها messages.tsx وتتكرر كل ٥ ثواني بالخلفية
--    وقت فتح الصفحة) تفلتر بـ .or(sender_id.eq,receiver_id.eq) — الفهرس
--    الموجود مسبقاً (LEAST/GREATEST) مصمم لجلب محادثة واحدة محددة، مو
--    لهذا النوع من الفلترة الأوسع، فكان فحص كامل للجدول بكل استعلام.
CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages (receiver_id, created_at DESC);
