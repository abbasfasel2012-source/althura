import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { fetchGroups, ar } from "@/lib/data";
import { Users, MessageCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الكروبات" },
      { name: "description", content: "تواصل مع زملائك ومعلميك عبر الكروبات الحقيقية." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  return (
    <AppShell title="الكروبات">
      <div className="animate-reveal mb-4">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          محادثات نشطة
        </div>
        <h1 className="text-2xl font-bold">الكروبات الحقيقية</h1>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin mb-2" />
          <p className="text-sm">جاري تحميل الكروبات...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-medium">
          حدث خطأ أثناء تحميل الكروبات. تأكد من تسجيل الدخول.
        </div>
      )}

      <div className="space-y-3">
        {groups?.map((g) => (
          <Link key={g.id} to={`/groups/${g.id}`} className="block transition-transform active:scale-[0.98]">
            <Card>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-accent/10 text-accent grid place-items-center shrink-0">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{g.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {g.last_message || "لا توجد رسائل بعد"}
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="font-mono text-xs font-bold text-primary">{ar(g.members_count || 0)}</div>
                  <div className="text-[9px] text-muted-foreground">عضو</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {!isLoading && groups?.length === 0 && (
          <div className="text-center py-10 glass rounded-3xl">
            <MessageCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد كروبات حالياً</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
