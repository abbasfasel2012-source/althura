import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { BookItem, ar, fetchBooks, signedBookUrl } from "@/lib/data";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | المكتبة" },
      { name: "description", content: "مكتبة الكتب الإلكترونية الحقيقية للمدرسة." },
    ],
  }),
  component: BooksPage,
});

const COLORS = [
  "from-amber-200 to-orange-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-rose-200 to-pink-300",
  "from-violet-200 to-purple-300",
  "from-yellow-200 to-amber-300",
];

function BooksPage() {
  const books = useQuery({ queryKey: ["books"], queryFn: fetchBooks });
  const list = books.data ?? [];

  return (
    <AppShell title="المكتبة">
      <div className="animate-reveal">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          {ar(list.length)} كتاب متاح
        </div>
        <h1 className="text-2xl font-bold">مكتبة الذرى</h1>
        <p className="text-sm text-muted-foreground mt-1">كل ما يرفعه المالك من مناهج وملخصات.</p>
      </div>

      {books.isLoading && (
        <Card className="mt-6 py-10 text-center"><Loader2 className="size-5 animate-spin mx-auto text-primary" /></Card>
      )}

      {!books.isLoading && list.length === 0 && (
        <Card className="mt-6 text-center text-xs text-muted-foreground py-10">
          لا توجد كتب بعد — سيظهر هنا كل كتاب يرفعه المالك.
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {list.map((b, i) => (
          <BookCard key={b.id} book={b} color={COLORS[i % COLORS.length]} />
        ))}
      </div>
    </AppShell>
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
