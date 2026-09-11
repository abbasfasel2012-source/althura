import pdf from "pdf-parse";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 250;

type Book = { id: string; title: string; subject: string | null; grade: string | null; file_url: string };

type EmbeddingResponse = { embedding?: { values?: number[] }; error?: { message?: string } };

async function extractPdfTextWithOcr(pdfBytes: Buffer) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("مفتاح جِمناي غير مهيأ للتعرف البصري على الحروف");
  if (pdfBytes.byteLength > 18 * 1024 * 1024) {
    throw new Error("ملف الكتاب المصوّر أكبر من الحد المسموح للمعالجة المباشرة؛ يجب تقسيمه إلى أجزاء أصغر");
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBytes.toString("base64"),
              },
            },
            {
              text: "استخرج النص العربي الكامل من هذا الكتاب صفحةً صفحة. ابدأ كل صفحة بعلامة واضحة مثل: صفحة 1. لا تلخص ولا تشرح ولا تضف أي نص من عندك. حافظ على العناوين والأسئلة والقوانين والجداول قدر الإمكان.",
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    },
  );
  const body = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  if (!response.ok || !text) throw new Error(body.error?.message ?? "تعذّر التعرف البصري على نص الكتاب");
  return text;
}

async function embed(text: string): Promise<number[]> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("مفتاح خدمة التضمين غير مهيأ");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );
  const body = (await response.json()) as EmbeddingResponse;
  if (!response.ok || !body.embedding?.values) {
    throw new Error(body.error?.message ?? "تعذّر إنشاء تمثيل النص");
  }
  return body.embedding.values;
}

function toPgVector(values: number[]) {
  return `[${values.join(",")}]`;
}

function splitText(text: string) {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: Array<{ content: string; pageNumber: number | null; chunkIndex: number }> = [];
  let chunkIndex = 0;
  const pages = clean.split(/\f|(?=\n?صفحة\s+\d+)/i);
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex].trim();
    if (!page) continue;
    for (let start = 0; start < page.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
      const content = page.slice(start, start + CHUNK_SIZE).trim();
      if (content.length >= 40) {
        chunks.push({ content, pageNumber: pageIndex + 1, chunkIndex: chunkIndex++ });
      }
      if (start + CHUNK_SIZE >= page.length) break;
    }
  }
  return chunks;
}

export async function indexBook(bookId: string) {
  const admin = supabaseAdmin as any;
  const { data: book, error: bookError } = await admin
    .from("books").select("id,title,subject,grade,file_url").eq("id", bookId).single();
  if (bookError || !book) throw bookError ?? new Error("الكتاب غير موجود");

  await admin.from("books").update({ indexing_status: "processing", indexing_error: null }).eq("id", bookId);
  try {
    const { data: file, error: downloadError } = await admin.storage.from("books").download(book.file_url);
    if (downloadError || !file) throw downloadError ?? new Error("تعذّر تنزيل ملف الكتاب");
    const pdfBytes = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(pdfBytes);
    let extractedText = parsed.text;
    if (extractedText.trim().length < 100) {
      extractedText = await extractPdfTextWithOcr(pdfBytes);
    }
    const chunks = splitText(extractedText);
    if (!chunks.length) throw new Error("لم يُستخرج نص من الكتاب حتى بعد تشغيل التعرف البصري على الحروف");

    await admin.from("book_chunks").delete().eq("book_id", bookId);
    for (let i = 0; i < chunks.length; i += 8) {
      const batch = chunks.slice(i, i + 8);
      const rows = [];
      for (const chunk of batch) {
        const embedding = await embed(chunk.content);
        rows.push({
          book_id: bookId,
          content: chunk.content,
          page_number: chunk.pageNumber,
          chunk_index: chunk.chunkIndex,
          embedding: toPgVector(embedding),
        });
      }
      const { error } = await admin.from("book_chunks").insert(rows);
      if (error) throw error;
    }
    await admin.from("books").update({ indexing_status: "ready", indexing_error: null }).eq("id", bookId);
    return { chunks: chunks.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت فهرسة الكتاب";
    await admin.from("books").update({ indexing_status: "failed", indexing_error: message }).eq("id", bookId);
    throw error;
  }
}

export async function searchBooks(question: string, grade?: string | null, subject?: string | null) {
  const embedding = await embed(question);
  const { data, error } = await (supabaseAdmin as any).rpc("search_book_chunks", {
    query_embedding: toPgVector(embedding),
    match_count: 6,
    requested_grade: grade ?? null,
    requested_subject: subject ?? null,
  });
  if (error) throw error;
  return (data ?? []).filter((row: { similarity: number }) => row.similarity >= 0.42);
}

export function bookContext(rows: Array<{ content: string; title: string; page_number: number | null; similarity: number }>) {
  return rows.map((row, index) =>
    `[المقطع ${index + 1}]\nالكتاب: ${row.title}\nالصفحة: ${row.page_number ?? "غير محددة"}\n${row.content}`,
  ).join("\n\n---\n\n");
}
