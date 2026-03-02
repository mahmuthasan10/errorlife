-- ============================================
-- ErrorLife - Veritabanı Şeması (Hafta 1)
-- ============================================

-- UUID oluşturucu
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES tablosu (kullanıcı profilleri)
-- Supabase Auth ile bağlantılı
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Username için unique index
create unique index profiles_username_idx on public.profiles (username);

-- RLS (Row Level Security) aktif
alter table public.profiles enable row level security;

-- Herkes profilleri okuyabilir
create policy "Profiller herkese açık"
  on public.profiles for select
  using (true);

-- Kullanıcı sadece kendi profilini düzenleyebilir
create policy "Kullanıcı kendi profilini düzenler"
  on public.profiles for update
  using (auth.uid() = id);

-- Yeni kayıt olan kullanıcı kendi profilini oluşturabilir
create policy "Kullanıcı kendi profilini oluşturur"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- 2. TAGS tablosu (kategoriler/etiketler)
-- ============================================
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now() not null
);

alter table public.tags enable row level security;

create policy "Etiketler herkese açık"
  on public.tags for select
  using (true);

-- ============================================
-- 3. POSTS tablosu (sorun paylaşımları)
-- user_id ile profiles tablosuna bağlı
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) > 0 and char_length(content) <= 1000),
  image_url text,
  like_count int default 0 not null,
  comment_count int default 0 not null,
  bookmark_count int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Kullanıcı gönderilerini hızlı sorgulamak için index
create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "Gönderiler herkese açık"
  on public.posts for select
  using (true);

create policy "Kullanıcı kendi gönderisini oluşturur"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi gönderisini düzenler"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Kullanıcı kendi gönderisini siler"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ============================================
-- 4. JOBS tablosu (iş ilanları / yardım talepleri)
-- ============================================
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (char_length(title) > 0 and char_length(title) <= 200),
  description text not null check (char_length(description) > 0 and char_length(description) <= 3000),
  budget numeric(10,2),
  status text default 'open' not null check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index jobs_user_id_idx on public.jobs (user_id);
create index jobs_status_idx on public.jobs (status);
create index jobs_created_at_idx on public.jobs (created_at desc);

alter table public.jobs enable row level security;

create policy "İlanlar herkese açık"
  on public.jobs for select
  using (true);

create policy "Kullanıcı kendi ilanını oluşturur"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi ilanını düzenler"
  on public.jobs for update
  using (auth.uid() = user_id);

create policy "Kullanıcı kendi ilanını siler"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- ============================================
-- 5. POST_TAGS (çoka-çok ilişki: post <-> tag)
-- ============================================
create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

create policy "Post etiketleri herkese açık"
  on public.post_tags for select
  using (true);

create policy "Post sahibi etiket ekleyebilir"
  on public.post_tags for insert
  with check (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

-- ============================================
-- 6. JOB_TAGS (çoka-çok ilişki: job <-> tag)
-- ============================================
create table public.job_tags (
  job_id uuid references public.jobs(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (job_id, tag_id)
);

alter table public.job_tags enable row level security;

create policy "Job etiketleri herkese açık"
  on public.job_tags for select
  using (true);

create policy "Job sahibi etiket ekleyebilir"
  on public.job_tags for insert
  with check (
    auth.uid() = (select user_id from public.jobs where id = job_id)
  );

-- ============================================
-- 7. Otomatik updated_at trigger
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_posts_updated
  before update on public.posts
  for each row execute function public.handle_updated_at();

create trigger on_jobs_updated
  before update on public.jobs
  for each row execute function public.handle_updated_at();

-- ============================================
-- 8. Yeni kullanıcı kaydında otomatik profil oluştur
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Yeni Kullanıcı'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 9. Başlangıç etiketleri
-- ============================================
insert into public.tags (name, slug) values
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('React Native', 'react-native'),
  ('Next.js', 'nextjs'),
  ('Node.js', 'nodejs'),
  ('Python', 'python'),
  ('CSS', 'css'),
  ('HTML', 'html'),
  ('Veritabanı', 'veritabani'),
  ('API', 'api'),
  ('DevOps', 'devops'),
  ('Mobil', 'mobil'),
  ('Backend', 'backend'),
  ('Frontend', 'frontend'),
  ('Bug Fix', 'bug-fix'),
  ('Performans', 'performans'),
  ('Güvenlik', 'guvenlik');

-- ============================================
-- 10. Realtime yayınlarını aktifleştir
-- ============================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.jobs;
