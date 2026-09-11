-- فهرسة الكتب المرفوعة حتى يستطيع المساعد الرجوع إلى محتواها.
create extension if not exists vector;

alter table public.books
  add column if not exists indexing_status text not null default 'pending'
    check (indexing_status in ('pending', 'processing', 'ready', 'failed'));

alter table public.books
  add column if not exists indexing_error text;

create table if not exists public.book_chunks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  content text not null,
  page_number integer,
  chunk_index integer not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now(),
  unique (book_id, chunk_index)
);

create index if not exists book_chunks_embedding_idx
  on public.book_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists book_chunks_book_id_idx on public.book_chunks(book_id);

alter table public.book_chunks enable row level security;

drop policy if exists "book_chunks_read_authenticated" on public.book_chunks;
create policy "book_chunks_read_authenticated" on public.book_chunks
  for select to authenticated using (true);

grant select on public.book_chunks to authenticated;
grant all on public.book_chunks to service_role;

drop function if exists public.search_book_chunks(vector(768), integer, text, text);
create or replace function public.search_book_chunks(
  query_embedding vector(768),
  match_count integer default 6,
  requested_grade text default null,
  requested_subject text default null
)
returns table (
  content text,
  page_number integer,
  title text,
  grade text,
  subject text,
  similarity real
)
language sql stable security invoker
as $$
  select
    c.content,
    c.page_number,
    b.title,
    b.grade,
    b.subject,
    (1 - (c.embedding <=> query_embedding))::real as similarity
  from public.book_chunks c
  join public.books b on b.id = c.book_id
  where b.indexing_status = 'ready'
    and (requested_grade is null or b.grade is null or b.grade = requested_grade)
    and (requested_subject is null or b.subject is null or b.subject ilike requested_subject)
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 12));
$$;

grant execute on function public.search_book_chunks(vector(768), integer, text, text) to authenticated;
grant execute on function public.search_book_chunks(vector(768), integer, text, text) to service_role;
