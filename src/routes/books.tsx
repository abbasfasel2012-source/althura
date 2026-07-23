import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import {
  BookItem, ar, fetchBooks, signedBookUrl, fetchVideos, youtubeEmbedUrl,
} from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Download, Loader2, PlayCircle, BookOpen, Film, Plus, GraduationCap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المكتبة" },
      { name: "description", content: "المكتبة الرقمية: كتب وفيديوهات تعليمية." },
    ],
  }),
  component: LibraryPage,
});

const COLORS = [
  "from-amber-200 to-orange-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-rose-200 to-pink-300",
  "from-violet-200 to-purple-300",
  "from-yellow-200 to-amber-300",
];

function LibraryPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState<"books" | "videos">("books");
  const books = useQuery({ queryKey: ["books"], queryFn: fetchBooks });
  const videos = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });

  const booksList = books.data ?? [];
  const videosList = videos.data ?? [];

  return (
    <AppShell title="المكتبة">
      <div className="animate-reveal flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
            {tab === "books"
              ? `${ar(String(booksList.length).padStart(2, "0"))} كتاب`
              : `${ar(String(videosList.length).padStart(2, "0"))} فيديو`}
          </div>
          <h1 className="text-2xl font-bold">مكتبة الذرى</h1>
          <p className="text-sm text-muted-foreground mt-1">كل ما يرفعه المالك من كتب وفيديوهات.</p>
        </div>
        {isOwner && (
          <Link
            to={tab === "books" ? "/admin" : "/videos"}
            className="size-11 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-soft shrink-0"
            aria-label="إضافة"
          >
            <Plus className="size-5" />
          </Link>
        )}
      </div>

      <div className="mt-4 glass rounded-2xl p-1 grid grid-cols-2 gap-1">
        <TabBtn active={tab === "books"} onClick={() => setTab("books")} icon={<BookOpen className="size-4" />}>الكتب</TabBtn>
        <TabBtn active={tab === "videos"} onClick={() => setTab("videos")} icon={<Film className="size-4" />}>الفيديوهات</TabBtn>
      </div>

      {tab === "books" ? (
        <>
          {books.isLoading && (
            <Card className="mt-6 py-10 text-center"><Loader2 className="size-5 animate-spin mx-auto text-primary" /></Card>
          )}
          {!books.isLoading && booksList.length === 0 && (
            <Card className="mt-6 text-center text-xs text-muted-foreground py-10">
              لا توجد كتب بعد.
            </Card>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {booksList.map((b, i) => (
              <BookCard key={b.id} book={b} color={COLORS[i % COLORS.length]} />
            ))}
          </div>
        </>
      ) : (
        <>
          {videos.isLoading && (
            <Card className="mt-6 py-10 text-center"><Loader2 className="size-5 animate-spin mx-auto text-primary" /></Card>
          )}
          {!videos.isLoading && videosList.length === 0 && (
            <Card className="mt-6 text-center text-xs text-muted-foreground py-10">
              لا توجد فيديوهات بعد.
            </Card>
          )}
          <div className="space-y-3 mt-5">
            {videosList.map((v) => <VideoRow key={v.id} v={v} />)}
          </div>
        </>
      )}
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function BookCard({ book, color }: { book: BookItem; color: string }) {
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    try {
      const url = await signedBookUrl(book.file_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={open} className="glass rounded-2xl p-3 animate-reveal text-right">
      <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${color} relative overflow-hidden mb-2 grid place-items-center text-center p-3`}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="text-xs font-bold text-stone-800 leading-tight">{book.title}</div>
        )}
        {book.subject && (
          <div className="absolute bottom-2 left-2 right-2 text-[9px] text-stone-700/80 font-mono">
            {book.subject}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-bold truncate">{book.grade || "عام"}</div>
        {busy ? <Loader2 className="size-3.5 animate-spin text-primary" /> : <Download className="size-3.5 text-primary" />}
      </div>
    </button>
  );
}

function VideoRow({ v }: { v: any }) {
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(v.video_url);
  return (
    <Card>
      {playing && embed ? (
        <div className="aspect-video rounded-2xl overflow-hidden -m-1 mb-3">
          <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={v.title} />
        </div>
      ) : playing && !embed ? (
        <video src={v.video_url} controls className="w-full aspect-video rounded-2xl mb-3" />
      ) : (
        <button onClick={() => setPlaying(true)} className="relative w-full aspect-video rounded-2xl overflow-hidden mb-3 bg-surface-2 grid place-items-center">
          {v.thumbnail_url ? (
            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-black/40 grid place-items-center">
            <PlayCircle className="size-14 text-white drop-shadow-lg" strokeWidth={1.5} />
          </div>
        </button>
      )}
      <div className="min-w-0">
        {v.subject && <div className="text-[10px] tracking-[0.2em] text-primary font-bold uppercase mb-1">{v.subject}</div>}
        <h3 className="font-bold text-sm">{v.title}</h3>
        {v.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{v.description}</p>}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
          <GraduationCap className="size-3" />
          {v.grade ? `الصف ${v.grade}` : "كل الصفوف"}
          {v.section ? ` • شعبة ${v.section}` : ""}
        </div>
      </div>
    </Card>
  );
}
