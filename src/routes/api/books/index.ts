import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { indexBook } from "@/lib/book-rag.server";

async function userId(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(value.slice(7));
  return error ? null : (data?.claims?.sub ?? null);
}

export const Route = createFileRoute("/api/books/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = await userId(request);
        if (!id) return new Response("غير مصرح", { status: 401 });
        const { bookId } = await request.json() as { bookId?: string };
        if (!bookId) return new Response("معرّف الكتاب مطلوب", { status: 400 });
        const result = await indexBook(bookId);
        return Response.json(result);
      },
    },
  },
});
