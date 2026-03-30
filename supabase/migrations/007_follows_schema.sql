-- ============================================
-- ErrorLife - Follows (Takip Sistemi) Şeması
-- ============================================

-- ============================================
-- 1. FOLLOWS tablosu
-- ============================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,

  -- Aynı kişiyi iki kez takip etmeyi engelle
  constraint follows_unique unique (follower_id, following_id),

  -- Kendini takip etmeyi engelle
  constraint follows_no_self_follow check (follower_id <> following_id)
);

-- Sorgu performansı için indexler
create index follows_follower_idx on public.follows (follower_id);
create index follows_following_idx on public.follows (following_id);

-- ============================================
-- 2. RLS Politikaları
-- ============================================
alter table public.follows enable row level security;

-- Herkes takip ilişkilerini görebilir
create policy "Takipler herkese açık"
  on public.follows for select
  using (true);

-- Kullanıcı sadece kendi adına takip edebilir
create policy "Kullanıcı sadece kendi adına takip eder"
  on public.follows for insert
  with check (auth.uid() = follower_id);

-- Kullanıcı sadece kendi takiplerini kaldırabilir
create policy "Kullanıcı sadece kendi takibini kaldırır"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ============================================
-- 3. Profiles tablosuna sayaç sütunları ekle
-- ============================================
alter table public.profiles
  add column followers_count integer not null default 0,
  add column following_count integer not null default 0;

-- ============================================
-- 4. Sayaç güncelleme fonksiyonu ve trigger
-- ============================================
create or replace function public.update_follow_counts()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    -- Takip eden kişinin following_count'unu artır
    update public.profiles
      set following_count = following_count + 1
      where id = new.follower_id;

    -- Takip edilen kişinin followers_count'unu artır
    update public.profiles
      set followers_count = followers_count + 1
      where id = new.following_id;

    return new;

  elsif (tg_op = 'DELETE') then
    -- Takip eden kişinin following_count'unu azalt
    update public.profiles
      set following_count = greatest(following_count - 1, 0)
      where id = old.follower_id;

    -- Takip edilen kişinin followers_count'unu azalt
    update public.profiles
      set followers_count = greatest(followers_count - 1, 0)
      where id = old.following_id;

    return old;
  end if;

  return null;
end;
$$;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row
  execute function public.update_follow_counts();
