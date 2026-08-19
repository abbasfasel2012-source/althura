import { createFileRoute, Outlet } from "@tanstack/react-router";

// طبقة تخطيط فارغة فقط — كل منطق قائمة الكروبات انتقل لـ groups.index.tsx.
// قبل هذا، الصفحة كانت تجيب قائمة الكروبات (وتشغّل كل الاستعلامات
// والحالة الخاصة فيها) حتى لما تكون بصفحة كروب محدد /groups/$groupId،
// وهذا يسبب طلب شبكة زائد بكل مرة وإحساس بأن قائمة الكروبات "تومض"
// قبل ما تفتح المحادثة. الحين كل route عنده منطقه الخاص فقط.
export const Route = createFileRoute("/groups")({
  component: () => <Outlet />,
});
