import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ar, fetchVideos, createVideo, deleteVideo, youtubeEmbedUrl } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Loader2, Plus, Trash2, X, PlayCircle, GraduationCap } from "lucide-react";
import { GRADE_NAMES, type Grade } from "@/lib/store";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | مكتبة الفيديوهات" },
      { name: "description", content: "فيديوهات تعليمية لكل صف وشعبة." },
    ],
  }),
  component: VideosPage,
});

const GRADES: Grade[] = ["1","2","3","4","5","6"];

function VideosPage() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const { data: videos = [], isLoading } = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });

  const del = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });

  return (
    <AppShell title="مكتبة الفيديوهات">
      <div className="animate-reveal flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">مكتبة</div>
          <h1 className="text-2xl font-bold">
            {videos.length > 0 ? `${ar(videos.length)} فيديو` : "الفيديوهات"}
          </h1>
        </div>
        {isOwner && (
          <button onClick={() => setShowAdd(true)} className="size-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-soft" aria-label="إضافة">
            <Plus className="size-5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : videos.length === 0 ? (
        <Card className="mt-6 text-center py-10 text-sm text-muted-foreground">لا توجد فيديوهات بعد.</Card>
      ) : (
        <div className="space-y-3 mt-5">
          {videos.map((v, i) => {
            const embed = youtubeEmbedUrl(v.video_url);
            const isPlaying = playing === v.id;
            return (
              <Card key={v.id}>
                {isPlaying && embed ? (
                  <div className="aspect-video rounded-2xl overflow-hidden -m-1 mb-3">
                    <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={v.title} />
                  </div>
                ) : isPlaying && !embed ? (
                  <video src={v.video_url} controls className="w-full aspect-video rounded-2xl mb-3" />
                ) : (
                  <button onClick={() => setPlaying(v.id)} className="relative w-full aspect-video rounded-2xl overflow-hidden mb-3 bg-surface-2 grid place-items-center">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-black/40 grid place-items-center">
                      <PlayCircle className="size-14 text-white drop-shadow-lg" strokeWidth={1.5} />
                    </div>
                  </button>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {v.subject && <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">{v.subject}</div>}
                    <h3 className="font-bold text-sm">{v.title}</h3>
                    {v.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{v.description}</p>}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
                      <GraduationCap className="size-3" />
                      {v.grade ? (GRADE_NAMES[v.grade as Grade] ?? `الصف ${v.grade}`) : "كل الصفوف"}
                      {v.section ? ` • شعبة ${v.section}` : ""}
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={() => confirm("حذف الفيديو؟") && del.mutate(v.id)} className="text-destructive text-[11px] flex items-center gap-1 shrink-0">
                      <Trash2 className="size-3" /> حذف
                    </button>
                  )}
                </div>
                <div className="ink-watermark">{ar(String(i + 1).padStart(2, "0"))}</div>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && isOwner && (
        <AddVideoModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ["videos"] }); }} />
      )}
    </AppShell>
  );
}

function AddVideoModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!title.trim() || !videoUrl.trim()) { setErr("العنوان والرابط مطلوبان"); return; }
    setBusy(true);
    try {
      await createVideo({
        title: title.trim(),
        description: description.trim() || undefined,
        video_url: videoUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || undefined,
        subject: subject.trim() || undefined,
        grade: grade || null,
        section: section.trim() || null,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الحفظ");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="glass-strong rounded-3xl p-4 max-w-lg mx-auto my-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">إضافة فيديو</h2>
            <button onClick={onClose} className="size-8 grid place-items-center rounded-xl bg-surface-2/60"><X className="size-4" /></button>
          </div>
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الفيديو" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="رابط الفيديو (YouTube أو mp4)" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="رابط الصورة المصغّرة (اختياري)" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="المادة (اختياري)" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف اختياري" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm">
                <option value="">كل الصفوف</option>
                {GRADES.map((g) => <option key={g} value={g}>صف {g}</option>)}
              </select>
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="شعبة (اختياري)" className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-sm" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              اترك الصف/الشعبة فارغين للسماح لكل الطلاب بالمشاهدة.
            </div>
          </div>
          {err && <div className="mt-3 text-xs text-destructive">{err}</div>}
          <button disabled={busy} onClick={submit} className="mt-4 w-full py-3 rounded-2xl bg-accent text-accent-foreground font-bold disabled:opacity-50">
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
