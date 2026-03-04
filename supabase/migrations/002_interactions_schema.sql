-- ============================================
-- ErrorLife - Etkileşimler Şeması (Hafta 5)
-- likes, comments, bookmarks tabloları
-- Counter cache trigger'ları
-- ============================================

-- ============================================
-- 1. LIKES tablosu
-- ============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,

  constraint likes_user_post_unique unique (user_id, post_id)
);

create index likes_post_id_idx on public.likes (post_id);
create index likes_user_id_idx on public.likes (user_id);

alter table public.likes enable row level security;

create policy "Beğeniler herkese açık"
  on public.likes for select
  using (true);

create policy "Giriş yapmış kullanıcı beğenebilir"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi beğenisini kaldırır"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ============================================
-- 2. BOOKMARKS tablosu
-- ============================================
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,

  constraint bookmarks_user_post_unique unique (user_id, post_id)
);

create index bookmarks_post_id_idx on public.bookmarks (post_id);
create index bookmarks_user_id_idx on public.bookmarks (user_id);

alter table public.bookmarks enable row level security;

create policy "Yer imleri herkese açık"
  on public.bookmarks for select
  using (true);

create policy "Giriş yapmış kullanıcı kaydedebilir"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi yer imini kaldırır"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ============================================
-- 3. COMMENTS tablosu
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null check (char_length(content) > 0 and char_length(content) <= 500),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_user_id_idx on public.comments (user_id);
create index comments_created_at_idx on public.comments (created_at desc);

alter table public.comments enable row level security;

create policy "Yorumlar herkese açık"
  on public.comments for select
  using (true);

create policy "Giriş yapmış kullanıcı yorum yapabilir"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi yorumunu düzenler"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Kullanıcı kendi yorumunu siler"
  on public.comments for delete
  using (auth.uid() = user_id);

-- comments için updated_at trigger (mevcut fonksiyonu kullan)
create trigger on_comments_updated
  before update on public.comments
  for each row execute function public.handle_updated_at();

-- ============================================
-- 4. COUNTER CACHE TRIGGER FONKSİYONLARI
-- posts.like_count, comment_count, bookmark_count
-- kolonları zaten 001 migration'da mevcut
-- ============================================

-- Like sayacı
create or replace function public.handle_like_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts
      set like_count = like_count + 1
      where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts
      set like_count = greatest(like_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute function public.handle_like_count();

-- Comment sayacı
create or replace function public.handle_comment_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts
      set comment_count = comment_count + 1
      where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts
      set comment_count = greatest(comment_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function public.handle_comment_count();

-- Bookmark sayacı
create or replace function public.handle_bookmark_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts
      set bookmark_count = bookmark_count + 1
      where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts
      set bookmark_count = greatest(bookmark_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_bookmark_change
  after insert or delete on public.bookmarks
  for each row execute function public.handle_bookmark_count();

-- ============================================
-- 5. Realtime yayınlarına ekle
-- ============================================
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.bookmarks;
