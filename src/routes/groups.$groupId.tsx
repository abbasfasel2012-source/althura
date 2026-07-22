import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMessages, sendMessage, fetchGroups, joinGroup,
  uploadChatMedia, detectAttachmentType,
  editMessage, softDeleteMessage, toggleReaction, fetchReactions,
} from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Paperclip, Mic, StopCircle, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ProfileModal } from "@/components/ProfileModal";
import { ChatMessage, AttachmentPreview } from "@/components/ChatMessage";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupChatPage,
});

function GroupChatPage() {
  const { groupId } = Route.useParams();
  const { userId, isOwner } = useAuth();
  const [content, setContent] = useState("");
  const [openProfile, setOpenProfile] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("medium");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: groups } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const group = groups?.find((g) => g.id === groupId);
  const allowMedia = group?.allow_media !== false;

  useEffect(() => {
    if (userId && groupId) joinGroup(groupId).catch(() => {});
  }, [userId, groupId]);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["messages", groupId],
    queryFn: () => fetchMessages(groupId),
    refetchInterval: 3000,
    enabled: !!userId,
  });

  const ids = (messages ?? []).map((m) => m.id);
  const reactionsQ = useQuery({
    queryKey: ["reactions", "group", ids.join(",")],
    queryFn: () => fetchReactions(ids, "group"),
    enabled: ids.length > 0,
    refetchInterval: 4000,
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      let att = null;
      if (file) {
        const uploaded = await uploadChatMedia(file, {
          filename: file.name,
          quality: detectAttachmentType(file) === "image" ? quality : "high",
        });
        att = { url: uploaded.url, type: uploaded.type, name: uploaded.name, size: uploaded.size };
      }
      await sendMessage(groupId, content, att);
    },
    onSuccess: () => {
      setContent(""); setFile(null);
      queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
    },
  });

  const editMut = useMutation({
    mutationFn: ({ id, c }: { id: string; c: string }) => editMessage(id, c),
    onSuccess: () => { setEditing(null); queryClient.invalidateQueries({ queryKey: ["messages", groupId] }); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => softDeleteMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", groupId] }),
  });
  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => toggleReaction("group", id, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reactions", "group"] }),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioFile = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        const uploaded = await uploadChatMedia(audioFile, { filename: audioFile.name, quality: "high" });
        await sendMessage(groupId, "", { url: uploaded.url, type: uploaded.type, name: uploaded.name, size: uploaded.size });
        queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch { alert("تعذّر الوصول إلى الميكروفون"); }
  }
  function stopRecording() { recRef.current?.stop(); setRecording(false); }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      if (editing.content.trim()) editMut.mutate({ id: editing.id, c: editing.content });
      return;
    }
    if ((!content.trim() && !file) || sendMut.isPending) return;
    sendMut.mutate();
  };

  return (
    <AppShell title={group?.name || "المحادثة"}>
      <div className="flex flex-col h-[calc(100vh-180px)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 px-1 scrollbar-hide">
          {!userId ? (
            <div className="text-center py-10 text-sm text-muted-foreground">يجب تسجيل الدخول</div>
          ) : isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm text-center">تعذّر تحميل الرسائل</div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">ابدأ المحادثة الآن...</div>
          ) : (
            messages?.map((m) => (
              <ChatMessage
                key={m.id}
                m={{
                  id: m.id, sender_id: m.user_id, content: m.content,
                  attachment_url: m.attachment_url, attachment_type: m.attachment_type,
                  attachment_name: m.attachment_name, edited_at: m.edited_at,
                  deleted_at: m.deleted_at, created_at: m.created_at,
                  sender_name: m.profiles?.full_name,
                }}
                isMe={m.user_id === userId}
                myId={userId}
                reactions={(reactionsQ.data ?? []).filter((r) => r.message_id === m.id)}
                canEdit={m.user_id === userId || isOwner}
                onOpenProfile={(id) => setOpenProfile(id)}
                onEdit={(id, c) => setEditing({ id, content: c })}
                onDelete={(id) => delMut.mutate(id)}
                onReact={(id, e) => reactMut.mutate({ id, emoji: e })}
              />
            ))
          )}
          {openProfile && <ProfileModal userId={openProfile} onClose={() => setOpenProfile(null)} />}
        </div>

        {editing && (
          <div className="glass-strong rounded-2xl p-2 mb-2 flex items-center gap-2 text-xs">
            <span className="text-primary font-bold">تعديل:</span>
            <span className="flex-1 truncate opacity-70">{editing.content}</span>
            <button onClick={() => setEditing(null)} className="size-6 grid place-items-center rounded-lg bg-surface-2"><X className="size-3" /></button>
          </div>
        )}

        {file && !editing && (
          <AttachmentPreview
            file={file} quality={quality}
            onQualityChange={setQuality}
            onRemove={() => setFile(null)}
          />
        )}

        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          {allowMedia && !editing && (
            <>
              <input
                ref={fileRef} type="file" hidden
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
              />
              <button
                type="button" onClick={() => fileRef.current?.click()}
                className="size-11 shrink-0 rounded-2xl glass-strong border border-border grid place-items-center"
                aria-label="مرفق"
              >
                <Paperclip className="size-4" />
              </button>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`size-11 shrink-0 rounded-2xl border border-border grid place-items-center ${recording ? "bg-destructive text-white animate-pulse" : "glass-strong"}`}
                aria-label="تسجيل صوتي"
              >
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
            disabled={sendMut.isPending || editMut.isPending || (!editing && !content.trim() && !file)}
            className="absolute left-2 top-2 size-10 rounded-xl bg-primary text-white grid place-items-center disabled:opacity-50"
          >
            {sendMut.isPending || editMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
