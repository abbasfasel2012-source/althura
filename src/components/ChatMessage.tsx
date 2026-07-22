import { useState } from "react";
import { Download, Pencil, Trash2, Smile, MoreVertical, Play } from "lucide-react";
import { ar } from "@/lib/data";
import type { AttachmentType, Reaction } from "@/lib/data";

export const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export interface UnifiedMessage {
  id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  attachment_name: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender_name?: string;
}

export function ChatMessage({
  m, isMe, myId, reactions, canEdit, onOpenProfile,
  onEdit, onDelete, onReact,
}: {
  m: UnifiedMessage;
  isMe: boolean;
  myId: string | null;
  reactions: Reaction[];
  canEdit: boolean;
  onOpenProfile?: (id: string) => void;
  onEdit: (id: string, current: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const deleted = !!m.deleted_at;

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count += 1;
    if (r.user_id === myId) acc[r.emoji].mine = true;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}>
      {!isMe && m.sender_name && (
        <button
          onClick={() => onOpenProfile?.(m.sender_id)}
          className="text-[10px] font-bold text-primary hover:underline mb-1 px-1"
        >
          {m.sender_name}
        </button>
      )}

      <div className="flex items-end gap-1.5 max-w-[85%]">
        {isMe && !deleted && (
          <button
            onClick={() => setMenu(!menu)}
            className="opacity-0 group-hover:opacity-100 transition size-7 rounded-lg glass grid place-items-center"
            aria-label="خيارات"
          >
            <MoreVertical className="size-3.5" />
          </button>
        )}

        <div className={`relative ${isMe ? "bg-accent text-accent-foreground rounded-tr-none" : "glass rounded-tl-none"} rounded-2xl overflow-hidden`}>
          {deleted ? (
            <div className="px-4 py-2.5 text-sm italic opacity-60">— حُذفت الرسالة —</div>
          ) : (
            <>
              {m.attachment_url && m.attachment_type === "image" && (
                <a href={m.attachment_url} target="_blank" rel="noreferrer">
                  <img src={m.attachment_url} alt={m.attachment_name || ""} className="max-w-[260px] max-h-[280px] object-cover" />
                </a>
              )}
              {m.attachment_url && m.attachment_type === "video" && (
                <video src={m.attachment_url} controls className="max-w-[260px] max-h-[280px]" />
              )}
              {m.attachment_url && m.attachment_type === "audio" && (
                <audio src={m.attachment_url} controls className="max-w-[240px] my-2 mx-2" />
              )}
              {m.attachment_url && m.attachment_type === "file" && (
                <a
                  href={m.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  download={m.attachment_name || undefined}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm ${isMe ? "bg-black/10" : "bg-black/5"}`}
                >
                  <Download className="size-4" />
                  <span className="truncate max-w-[180px]">{m.attachment_name || "ملف"}</span>
                </a>
              )}
              {m.content && <div className="px-4 py-2 text-sm whitespace-pre-wrap break-words">{m.content}</div>}
              <div className="px-4 pb-1.5 text-[9px] opacity-60 text-left flex items-center gap-1 justify-end" dir="ltr">
                {m.edited_at && <span>edited ·</span>}
                {new Date(m.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </>
          )}
        </div>

        {!deleted && (
          <button
            onClick={() => setPicker(!picker)}
            className="opacity-0 group-hover:opacity-100 transition size-7 rounded-lg glass grid place-items-center"
            aria-label="تفاعل"
          >
            <Smile className="size-3.5" />
          </button>
        )}
      </div>

      {/* Reactions row */}
      {Object.keys(grouped).length > 0 && (
        <div className="flex gap-1 mt-1 px-1">
          {Object.entries(grouped).map(([e, v]) => (
            <button
              key={e}
              onClick={() => onReact(m.id, e)}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${v.mine ? "bg-primary/15 border-primary/40" : "glass border-border"}`}
            >
              {e} {ar(v.count)}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {picker && (
        <div className="mt-1 flex gap-1 glass-strong rounded-full px-2 py-1 shadow-glass">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => { onReact(m.id, e); setPicker(false); }}
              className="text-lg hover:scale-125 transition"
            >{e}</button>
          ))}
        </div>
      )}

      {/* Actions menu (author only) */}
      {menu && canEdit && (
        <div className="mt-1 flex gap-1 glass-strong rounded-xl p-1 shadow-glass">
          {!m.attachment_url && (
            <button
              onClick={() => { onEdit(m.id, m.content); setMenu(false); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg hover:bg-surface-2"
            >
              <Pencil className="size-3" /> تعديل
            </button>
          )}
          <button
            onClick={() => { if (confirm("حذف الرسالة؟")) { onDelete(m.id); setMenu(false); } }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="size-3" /> حذف
          </button>
        </div>
      )}
    </div>
  );
}

export function AttachmentPreview({
  file, quality, onQualityChange, onRemove,
}: {
  file: File;
  quality: "high" | "medium" | "low";
  onQualityChange: (q: "high" | "medium" | "low") => void;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  return (
    <div className="glass rounded-2xl p-2 flex items-center gap-2 mb-2">
      <div className="size-12 rounded-xl bg-surface-2 grid place-items-center shrink-0 overflow-hidden">
        {isImage ? <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
          : isVideo ? <Play className="size-5 text-primary" />
          : <Download className="size-5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold truncate">{file.name}</div>
        <div className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
        {isImage && (
          <div className="flex gap-1 mt-1">
            {(["high", "medium", "low"] as const).map((q) => (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                className={`text-[10px] px-2 py-0.5 rounded-full ${quality === q ? "bg-primary text-white" : "bg-surface-2"}`}
              >
                {q === "high" ? "أصلية" : q === "medium" ? "متوسطة" : "منخفضة"}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={onRemove} className="size-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
