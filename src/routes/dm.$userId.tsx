import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDirectMessages, sendDirectMessage, fetchProfileById,
  uploadChatMedia, detectAttachmentType,
  editDirectMessage, softDeleteDirectMessage, toggleReaction, fetchReactions,
  blockUser, unblockUser, isBlocked,
} from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowRight, Paperclip, Mic, StopCircle, X, Ban, ShieldOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ChatMessage, AttachmentPreview } from "@/components/ChatMessage";

export const Route = createFileRoute("/dm/$userId")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تواصل" },
      { name: "description", content: "محادثة خاصة بين أعضاء المدرسة." },
    ],
  }),
  component: DMPage,
});

function DMPage() {
  const { userId: otherId } = Route.useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("medium");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const profileQ = useQuery({ queryKey: ["profile", otherId], queryFn: () => fetchProfileById(otherId) });
  const blockedQ = useQuery({ queryKey: ["blocked", otherId], queryFn: () => isBlocked(otherId), enabled: !!userId });

  const messagesQ = useQuery({
    queryKey: ["dm", otherId], queryFn: () => fetchDirectMessages(otherId),
    refetchInterval: 3000, enabled: !!userId,
  });

  const ids = (messagesQ.data ?? []).map((m) => m.id);
  const reactionsQ = useQuery({
    queryKey: ["reactions", "dm", ids.join(",")],
    queryFn: () => fetchReactions(ids, "dm"),
    enabled: ids.length > 0,
    refetchInterval: 4000,
  });

  const send = useMutation({
    mutationFn: async () => {
      let att = null;
      if (file) {
        const u = await uploadChatMedia(file, {
          filename: file.name,
          quality: detectAttachmentType(file) === "image" ? quality : "high",
        });
        att = { url: u.url, type: u.type, name: u.name, size: u.size };
      }
      await sendDirectMessage(otherId, content, att);
    },
    onSuccess: () => {
      setContent(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["dm", otherId] });
    },
    onError: (e: Error) => alert(e.message),
  });

  const editMut = useMutation({
    mutationFn: ({ id, c }: { id: string; c: string }) => editDirectMessage(id, c),
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["dm", otherId] }); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => softDeleteDirectMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dm", otherId] }),
  });
  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => toggleReaction("dm", id, emoji),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions", "dm"] }),
  });
  const blockMut = useMutation({
    mutationFn: async () => {
      if (blockedQ.data) await unblockUser(otherId); else await blockUser(otherId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocked", otherId] }),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesQ.data]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const f = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        const u = await uploadChatMedia(f, { filename: f.name, quality: "high" });
        await sendDirectMessage(otherId, "", { url: u.url, type: u.type, name: u.name, size: u.size });
        qc.invalidateQueries({ queryKey: ["dm", otherId] });
      };
      rec.start(); recRef.current = rec; setRecording(true);
    } catch { alert("تعذّر الوصول إلى الميكروفون"); }
  }
  function stopRecording() { recRef.current?.stop(); setRecording(false); }

  const name = profileQ.data?.full_name ?? "محادثة";
  const label = profileQ.data?.teaching_subject || profileQ.data?.admin_label || (profileQ.data?.is_teacher ? "مدرّس" : "طالب");
  const isBlockedNow = !!blockedQ.data;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      if (editing.content.trim()) editMut.mutate({ id: editing.id, c: editing.content });
      return;
    }
    if ((!content.trim() && !file) || send.isPending) return;
    send.mutate();
  };

  return (
    <AppShell title="تواصل">
      <div className="flex items-center gap-3 mb-3 glass rounded-2xl p-3">
        <button onClick={() => navigate({ to: "/messages" })} className="size-9 grid place-items-center rounded-xl bg-surface-2">
          <ArrowRight className="size-4" />
        </button>
        
        <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center font-bold">
          {name[0] ?? "؟"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{label}</div>
        </div>
        <button
          onClick={() => blockMut.mutate()}
          className={`size-9 grid place-items-center rounded-xl ${isBlockedNow ? "bg-destructive/10 text-destructive" : "bg-surface-2"}`}
          aria-label={isBlockedNow ? "إلغاء الحظر" : "حظر"}
          title={isBlockedNow ? "إلغاء الحظر" : "حظر"}
        >
          {isBlockedNow ? <ShieldOff className="size-4" /> : <Ban className="size-4" />}
        </button>
      </div>

      {isBlockedNow && (
        <div className="mb-2 p-3 rounded-2xl bg-destructive/10 text-destructive text-xs text-center">
          لقد حظرت هذا المستخدم — لن تصلك رسائله.
        </div>
      )}

      <div className="flex flex-col h-[calc(100dvh-260px)] min-h-[400px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4 px-1 scrollbar-hide">
          {messagesQ.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (messagesQ.data ?? []).length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">لا رسائل بعد — ابدأ المحادثة.</div>
          ) : (
            messagesQ.data!.map((m) => (
              <ChatMessage
                key={m.id}
                m={{
                  id: m.id, sender_id: m.sender_id, content: m.content,
                  attachment_url: m.attachment_url, attachment_type: m.attachment_type,
                  attachment_name: m.attachment_name, edited_at: m.edited_at,
                  deleted_at: m.deleted_at, created_at: m.created_at,
                }}
                isMe={m.sender_id === userId}
                myId={userId}
                reactions={(reactionsQ.data ?? []).filter((r) => r.message_id === m.id)}
                canEdit={m.sender_id === userId}
                onEdit={(id, c) => setEditing({ id, content: c })}
                onDelete={(id) => delMut.mutate(id)}
                onReact={(id, e) => reactMut.mutate({ id, emoji: e })}
              />
            ))
          )}
        </div>

        {editing && (
          <div className="glass-strong rounded-2xl p-2 mb-2 flex items-center gap-2 text-xs">
            <span className="text-primary font-bold">تعديل:</span>
            <span className="flex-1 truncate opacity-70">{editing.content}</span>
            <button onClick={() => setEditing(null)} className="size-6 grid place-items-center rounded-lg bg-surface-2"><X className="size-3" /></button>
          </div>
        )}

        {file && !editing && (
          <AttachmentPreview file={file} quality={quality} onQualityChange={setQuality} onRemove={() => setFile(null)} />
        )}

        <form onSubmit={submit} className="relative flex items-center gap-2">
          {!editing && (
            <>
              <input ref={fileRef} type="file" hidden
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="size-11 shrink-0 rounded-2xl glass-strong border border-border grid place-items-center" aria-label="مرفق">
                <Paperclip className="size-4" />
              </button>
              <button type="button" onClick={recording ? stopRecording : startRecording}
                className={`size-11 shrink-0 rounded-2xl border border-border grid place-items-center ${recording ? "bg-destructive text-white animate-pulse" : "glass-strong"}`}
                aria-label="تسجيل صوتي">
                {recording ? <StopCircle className="size-4" /> : <Mic className="size-4" />}
              </button>
            </>
          )}
          <input
            value={editing ? editing.content : content}
            onChange={(e) => editing ? setEditing({ ...editing, content: e.target.value }) : setContent(e.target.value)}
            placeholder={editing ? "عدّل رسالتك..." : "اكتب رسالتك..."}
            className="flex-1 pl-14 pr-5 py-4 rounded-2xl glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={send.isPending || editMut.isPending || (!editing && !content.trim() && !file)}
            className="absolute left-2 top-2 size-10 rounded-xl bg-primary text-white grid place-items-center disabled:opacity-50"
          >
            {send.isPending || editMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
