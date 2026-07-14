import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGroups, createGroup, deleteGroup, ar } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Users, MessageCircle, Loader2, Plus, Trash2, Lock, Globe } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | الكروبات" },
      { name: "description", content: "تواصل مع زملائك ومعلميك عبر الكروبات." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const location = useLocation();
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);

  if (location.pathname !== "/groups") {
    return <Outlet />;
  }

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  const createMutation = useMutation({
    mutationFn: () => createGroup({ name: newName, description: newDesc || undefined, is_private: newPrivate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewPrivate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  return (
    <AppShell title="الكروبات">
      <div className="animate-reveal mb-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
            محادثات نشطة
          </div>
          <h1 className="text-2xl font-bold">الكروبات</h1>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs font-bold bg-accent text-accent-foreground px-3 py-2 rounded-xl"
          >
            <Plus className="size-3.5" />
            كروب جديد
          </button>
        )}
      </div>

      {/* Create Group Form (Admin only) */}
      {isOwner && showCreate && (
        <Card className="mb-4 space-y-3 animate-reveal">
          <div className="text-sm font-bold mb-2">إنشاء كروب جديد</div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم الكروب"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="وصف الكروب (اختياري)"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm"
          />
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={newPrivate}
              onChange={(e) => setNewPrivate(e.target.checked)}
              className="rounded"
            />
            كروب خاص (دعوة فقط)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              إنشاء
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-xl glass text-sm font-medium"
            >
              إلغاء
            </button>
          </div>
        </Card>
      )}

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
          <div key={g.id} className="flex items-center gap-2">
            <Link to={`/groups/${g.id}`} className="block flex-1 transition-transform active:scale-[0.98]">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-accent/10 text-accent grid place-items-center shrink-0">
                    <Users className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold text-sm truncate">{g.name}</div>
                      {g.is_private
                        ? <Lock className="size-3 text-muted-foreground shrink-0" />
                        : <Globe className="size-3 text-muted-foreground shrink-0" />}
                    </div>
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
            {isOwner && (
              <button
                onClick={() => { if (confirm("حذف الكروب؟")) deleteMutation.mutate(g.id); }}
                className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center shrink-0"
              >
                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            )}
          </div>
        ))}

        {!isLoading && groups?.length === 0 && (
          <div className="text-center py-10 glass rounded-3xl">
            <MessageCircle className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد كروبات حالياً</p>
            {isOwner && (
              <p className="text-xs text-muted-foreground mt-1">اضغط "كروب جديد" لإنشاء أول كروب</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
