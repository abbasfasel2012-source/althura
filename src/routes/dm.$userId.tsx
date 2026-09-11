import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDirectMessages, sendDirectMessage, fetchProfileById,
  uploadChatMedia, detectAttachmentType,
  editDirectMessage, softDeleteDirectMessage, toggleReaction, fetchReactions,
  blockUser, unblockUser, isBlocked,
} from "@/lib/data";
import { useState, useEffect, useMemo, useRef } from "react";
import { Send, Loader2, ArrowRight, Paperclip, Mic, StopCircle, X, Ban, ShieldOff, Phone, Video, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ChatMessage, AttachmentPreview } from "@/components/ChatMessage";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dm/$userId")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تواصل" },
      { name: "description", content: "محادثة خاصة بين أعضاء المدرسة." },
      { property: "og:title", content: "الذرى الذكية | تواصل" },
      { property: "og:description", content: "محادثة خاصة بين أعضاء المدرسة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("medium");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [call, setCall] = useState<{ type: "audio" | "video"; incoming: boolean; active: boolean } | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [speakerOn, setSpeakerOn] = useState(true);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingOfferRef = useRef<{ type: "audio" | "video"; offer: RTCSessionDescriptionInit } | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringContextRef = useRef<AudioContext | null>(null);

  const profileQ = useQuery({ queryKey: ["profile", otherId], queryFn: () => fetchProfileById(otherId) });
  const blockedQ = useQuery({ queryKey: ["blocked", otherId], queryFn: () => isBlocked(otherId), enabled: !!userId });

  const messagesQ = useQuery({
    queryKey: ["dm", otherId], queryFn: () => fetchDirectMessages(otherId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId || !otherId) return;
    const channel = supabase.channel(`dm:${[userId, otherId].sort().join(":")}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, (payload) => {
        const row = (payload.new ?? payload.old) as { sender_id?: string; receiver_id?: string };
        if ((row.sender_id === userId && row.receiver_id === otherId) || (row.sender_id === otherId && row.receiver_id === userId)) {
          void qc.invalidateQueries({ queryKey: ["dm", otherId] });
          void qc.invalidateQueries({ queryKey: ["conversations"] });
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, otherId, qc]);

  const ids = useMemo(() => (messagesQ.data ?? []).map((m) => m.id), [messagesQ.data]);
  const reactionsQ = useQuery({
    queryKey: ["reactions", "dm", ids.join(",")],
    queryFn: () => fetchReactions(ids, "dm"),
    enabled: ids.length > 0,
    refetchInterval: 6000,
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

  function cleanupCall() {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
    setCall(null);
  }

  async function createPeer(type: "audio" | "video") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => setRemoteStream(event.streams[0] ?? null);
    peer.onicecandidate = (event) => { if (event.candidate) void channelRef.current?.send({ type: "broadcast", event: "call-signal", payload: { from: userId, kind: "ice", candidate: event.candidate } }); };
    localStreamRef.current = stream;
    peerRef.current = peer;
    return peer;
  }

  async function startCall(type: "audio" | "video") {
    try {
      const peer = await createPeer(type);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCall({ type, incoming: false, active: true });
      await channelRef.current?.send({ type: "broadcast", event: "call-signal", payload: { from: userId, kind: "offer", callType: type, offer } });
    } catch { cleanupCall(); alert("تعذّر تشغيل المكالمة. تحقق من صلاحية الكاميرا والميكروفون."); }
  }

  async function answerCall(type: "audio" | "video", offer: RTCSessionDescriptionInit) {
    try {
      const peer = await createPeer(type);
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      setCall({ type, incoming: false, active: true });
      await channelRef.current?.send({ type: "broadcast", event: "call-signal", payload: { from: userId, kind: "answer", answer } });
    } catch { cleanupCall(); alert("تعذّر قبول المكالمة."); }
  }

  function acceptIncomingCall() {
    const pending = pendingOfferRef.current;
    if (!pending) return;
    pendingOfferRef.current = null;
    void answerCall(pending.type, pending.offer);
  }

  useEffect(() => {
    if (!userId || !otherId) return;
    const channel = supabase.channel(`call:${[userId, otherId].sort().join(":")}`);
    channelRef.current = channel;
    channel.on("broadcast", { event: "call-signal" }, async ({ payload }) => {
      if (payload.from === userId) return;
      if (payload.kind === "offer" && !peerRef.current) { pendingOfferRef.current = { type: payload.callType, offer: payload.offer }; setCall({ type: payload.callType, incoming: true, active: false }); }
      if (payload.kind === "answer" && peerRef.current) await peerRef.current.setRemoteDescription(payload.answer);
      if (payload.kind === "ice" && peerRef.current && payload.candidate) await peerRef.current.addIceCandidate(payload.candidate);
      if (payload.kind === "hangup") cleanupCall();
    }).subscribe();
    return () => { void supabase.removeChannel(channel); channelRef.current = null; cleanupCall(); };
  }, [userId, otherId]);

  function hangUp() { void channelRef.current?.send({ type: "broadcast", event: "call-signal", payload: { from: userId, kind: "hangup" } }); cleanupCall(); }

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = remoteStream; remoteAudioRef.current.volume = speakerOn ? 1 : 0; }
  }, [remoteStream, call, speakerOn]);

  useEffect(() => {
    if (!call?.incoming) {
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
      ringContextRef.current?.close().catch(() => {});
      ringContextRef.current = null;
      return;
    }
    const beep = () => {
      const context = ringContextRef.current ?? new AudioContext();
      ringContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.06;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    };
    beep();
    ringTimerRef.current = setInterval(beep, 1800);
    if ("vibrate" in navigator) navigator.vibrate([300, 700, 300]);
    return () => { if (ringTimerRef.current) clearInterval(ringTimerRef.current); ringTimerRef.current = null; };
  }, [call?.incoming]);

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
    <AppShell title={name} eyebrow="تواصل">
      <div className="flex items-center gap-3 mb-3 glass rounded-2xl p-3">
        <button onClick={() => navigate({ to: "/messages" })} className="size-9 grid place-items-center rounded-xl bg-surface-2">
          <ArrowRight className="size-4" />
        </button>
        
        <div className="size-11 rounded-2xl overflow-hidden bg-accent">
          <img src="/avatar-default.jpg" alt={name || "عضو"} className="size-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm leading-tight line-clamp-2" title={name}>{name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{label}</div>
        </div>
        <button type="button" onClick={() => void startCall("audio")} className="size-9 grid place-items-center rounded-xl bg-surface-2 text-primary" aria-label="مكالمة صوتية" title="مكالمة صوتية">
          <Phone className="size-4" />
        </button>
        <button type="button" onClick={() => void startCall("video")} className="size-9 grid place-items-center rounded-xl bg-surface-2 text-primary" aria-label="مكالمة مرئية" title="مكالمة مرئية">
          <Video className="size-4" />
        </button>
        <button
          onClick={() => blockMut.mutate()}
          className={`size-9 grid place-items-center rounded-xl ${isBlockedNow ? "bg-destructive/10 text-destructive" : "bg-surface-2"}`}
          aria-label={isBlockedNow ? "إلغاء الحظر" : "حظر"}
          title={isBlockedNow ? "إلغاء الحظر" : "حظر"}
        >
          {isBlockedNow ? <ShieldOff className="size-4" /> : <Ban className="size-4" />}
        </button>
      </div>

      {call && (
        <div className="mb-3 rounded-2xl glass-strong p-3" dir="rtl">
          {call.incoming ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">مكالمة {call.type === "video" ? "مرئية" : "صوتية"} واردة من {name}</span>
              <div className="flex gap-2"><button type="button" onClick={acceptIncomingCall} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">قبول</button><button type="button" onClick={hangUp} className="rounded-xl bg-destructive px-3 py-2 text-xs font-bold text-white">رفض</button></div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-black/10">
              {call.type === "video" && <><video ref={remoteVideoRef} autoPlay playsInline className="min-h-48 w-full rounded-xl object-cover" /><video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-2 end-2 h-24 w-20 rounded-lg object-cover" /></>}
              {call.type === "audio" && <div className="p-6 text-center text-sm">مكالمة صوتية مع {name}</div>}
              <audio ref={remoteAudioRef} autoPlay />
              <button type="button" onClick={() => setSpeakerOn((value) => !value)} className="mx-auto flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs" aria-label={speakerOn ? "إيقاف مكبر الصوت" : "تشغيل مكبر الصوت"}>{speakerOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{speakerOn ? "مكبر الصوت" : "السماعة"}</button>
              <button type="button" onClick={hangUp} className="mx-auto my-2 flex size-10 items-center justify-center rounded-full bg-destructive text-white" aria-label="إنهاء المكالمة"><PhoneOff className="size-4" /></button>
            </div>
          )}
        </div>
      )}

      {isBlockedNow && (
        <div className="mb-2 p-3 rounded-2xl bg-destructive/10 text-destructive text-xs text-center">
          لقد حظرت هذا المستخدم — لن تصلك رسائله.
        </div>
      )}

      <div className="flex h-[calc(100dvh-260px)] max-h-[calc(100dvh-260px)] min-h-0 flex-col overflow-hidden">
        <div ref={scrollRef} className="scroll-y-native min-h-0 flex-1 space-y-3 pb-4 px-1 scrollbar-hide">
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

        <form onSubmit={submit} className="relative flex shrink-0 items-center gap-2">
          {!editing && (
            <>
              <input ref={fileRef} type="file" hidden
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="size-10 shrink-0 rounded-xl glass-strong border border-border grid place-items-center active:scale-95" aria-label="مرفق">
                <Paperclip className="size-4" />
              </button>
              <button type="button" onClick={recording ? stopRecording : startRecording}
                className={`size-10 shrink-0 rounded-xl border border-border grid place-items-center active:scale-95 ${recording ? "bg-destructive text-white animate-pulse" : "glass-strong"}`}
                aria-label="تسجيل صوتي">
                {recording ? <StopCircle className="size-4" /> : <Mic className="size-4" />}
              </button>
            </>
          )}
          <input
            value={editing ? editing.content : content}
            onChange={(e) => editing ? setEditing({ ...editing, content: e.target.value }) : setContent(e.target.value)}
            placeholder={editing ? "عدّل رسالتك..." : "اكتب رسالتك..."}
            className="min-w-0 flex-1 pe-12 ps-4 py-3 rounded-xl glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={send.isPending || editMut.isPending || (!editing && !content.trim() && !file)}
            className="absolute end-1.5 top-1.5 size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 active:scale-95"
          >
            {send.isPending || editMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
