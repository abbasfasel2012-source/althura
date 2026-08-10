import { useRef, useState } from "react";
import { Download, Pencil, Trash2, Smile, Play, Copy, X } from "lucide-react";
import { ar } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const [sheet, setSheet] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleted = !!m.deleted_at;

  const grouped = reactions.reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count += 1;
    if (r.user_id === myId) acc[r.emoji].mine = true;
    return acc;
  }, {});

  const startPress = () => {
    if (deleted) return;
    clearPress();
    timer.current = setTimeout(() => {
      setSheet(true);
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
    }, 450);
  };
  const clearPress = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  return (
    <div style={{ contain: "layout style" }} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      {!isMe && m.sender_name && (
        <button
          onClick={() => onOpenProfile?.(m.sender_id)}
          className="text-[10px] font-bold text-primary hover:underline mb-0.5 px-1"
        >
          {m.sender_name}
        </button>
      )}

      <div
        onPointerDown={startPress}
        onPointerUp={clearPress}
        onPointerLeave={clearPress}
        onPointerCancel={clearPress}
        onContextMenu={(e) => { e.preventDefault(); if (!deleted) setSheet(true); }}
        className={`select-none max-w-[80%] relative ${
          isMe ? "bg-accent text-accent-foreground rounded-tr-none" : "glass rounded-tl-none"
        } rounded-2xl overflow-hidden ${sheet ? "ring-2 ring-primary" : ""}`}
      >
        {deleted ? (
          <div className="px-3 py-2 text-[13px] italic opacity-60">{t("chat.deleted")}</div>
        ) : (
          <>
            {m.attachment_url && m.attachment_type === "image" && (
              <a href={m.attachment_url} target="_blank" rel="noreferrer">
                <img
                  src={m.attachment_url}
                  alt={m.attachment_name || ""}
                  loading="lazy"
                  className="w-full max-w-[200px] max-h-[220px] object-cover"
                />
              </a>
            )}
            {m.attachment_url && m.attachment_type === "video" && (
              <video src={m.attachment_url} controls preload="metadata" className="w-full max-w-[200px] max-h-[220px]" />
            )}
            {m.attachment_url && m.attachment_type === "audio" && (
              <audio src={m.attachment_url} controls preload="none" className="w-[200px] my-1.5 mx-1.5" />
            )}
            {m.attachment_url && m.attachment_type === "file" && (
              <a
                href={m.attachment_url}
                target="_blank"
                rel="noreferrer"
                download={m.attachment_name || undefined}
                className={`flex items-center gap-2 px-2.5 py-2 text-[13px] ${isMe ? "bg-black/10" : "bg-black/5"}`}
              >
                <Download className="size-3.5 shrink-0" />
                <span className="truncate max-w-[150px]">{m.attachment_name || "ملف"}</span>
              </a>
            )}
            {m.content && (
              <div className="px-3 py-1.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                {m.content}
              </div>
            )}
            <div className="px-3 pb-1 text-[9px] opacity-60 flex items-center gap-1 justify-end" dir="ltr">
              {m.edited_at && <span>edited ·</span>}
              {new Date(m.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </>
        )}
      </div>

      {Object.keys(grouped).length > 0 && (
        <div className="flex gap-1 mt-0.5 px-1">
          {Object.entries(grouped).map(([e, v]) => (
            <button
              key={e}
              onClick={() => onReact(m.id, e)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${v.mine ? "bg-primary/15 border-primary/40" : "glass border-border"}`}
            >
              {e} {ar(v.count)}
            </button>
          ))}
        </div>
      )}

      {/* Long-press action sheet */}
      {sheet && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 animate-fade"
          onClick={() => setSheet(false)}
        >
          <div
            className="w-full max-w-md m-3 mb-6 rounded-3xl bg-surface-2 border border-border shadow-glass p-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={t("chat.actions")}
          >
            <div className="flex justify-center gap-1.5 pb-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onReact(m.id, e); setSheet(false); }}
                  className="text-2xl active:scale-125 transition"
                >{e}</button>
              ))}
            </div>

            {m.content && (
              <SheetBtn
                icon={<Copy className="size-4" />}
                label={t("chat.copy")}
                onClick={() => { navigator.clipboard?.writeText(m.content); setSheet(false); }}
              />
            )}
            {canEdit && !m.attachment_url && m.content && (
              <SheetBtn
                icon={<Pencil className="size-4" />}
                label={t("chat.edit")}
                onClick={() => { onEdit(m.id, m.content); setSheet(false); }}
              />
            )}
            {canEdit && (
              <SheetBtn
                icon={<Trash2 className="size-4" />}
                label={t("chat.delete")}
                danger
                onClick={() => { if (confirm(t("chat.confirmDelete"))) { onDelete(m.id); } setSheet(false); }}
              />
            )}
            <SheetBtn
              icon={<X className="size-4" />}
              label={t("chat.cancel")}
              onClick={() => setSheet(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SheetBtn({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold active:scale-[0.98] transition ${
        danger ? "text-destructive bg-destructive/10" : "bg-surface"
      }`}
    >
      {icon}
      {label}
    </button>
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
      <div className="size-11 rounded-xl bg-surface-2 grid place-items-center shrink-0 overflow-hidden">
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
                className={`text-[10px] px-2 py-0.5 rounded-full ${quality === q ? "bg-primary text-primary-foreground" : "bg-surface-2"}`}
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
