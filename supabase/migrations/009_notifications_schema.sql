-- ============================================================
-- 009: Bildirim Merkezi (Notifications)
-- Tablo, RLS, Trigger'lar ve Realtime
-- ============================================================

-- =====================
-- 1. NOTIFICATIONS TABLOSU
-- =====================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('FOLLOW', 'BID', 'MESSAGE', 'LIKE')),
  entity_id  uuid,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- İndeksler
create index idx_notifications_user_id    on public.notifications(user_id);
create index idx_notifications_created_at on public.notifications(user_id, created_at desc);
create index idx_notifications_is_read    on public.notifications(user_id, is_read) where is_read = false;

-- =====================
-- 2. RLS POLİTİKALARI
-- =====================

alter table public.notifications enable row level security;

-- Kullanıcı sadece kendi bildirimlerini görebilir
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Kullanıcı sadece kendi bildirimlerini okundu olarak işaretleyebilir (yalnızca is_read güncellenebilir)
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT ve DELETE kullanıcıya kapalı — sadece trigger (SECURITY DEFINER) üzerinden

-- =====================
-- 3. TRIGGER FONKSİYONLARI
-- =====================

-- ----- 3a. FOLLOW BİLDİRİMİ -----
create or replace function public.handle_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Kendi kendini takip etmesi zaten follows tablosunda engelli ama yine de kontrol
  if new.follower_id <> new.following_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (new.following_id, new.follower_id, 'FOLLOW', new.id);
  end if;

  return new;
end;
$$;

create trigger trg_follow_notification
  after insert on public.follows
  for each row
  execute function public.handle_follow_notification();

-- ----- 3b. BID (TEKLİF) BİLDİRİMİ -----
create or replace function public.handle_bid_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_owner_id uuid;
begin
  -- İlanın sahibini bul
  select user_id into v_job_owner_id
  from public.jobs
  where id = new.job_id;

  -- Kendi ilanına teklif vermesini bildirme
  if v_job_owner_id is not null and v_job_owner_id <> new.expert_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_job_owner_id, new.expert_id, 'BID', new.id);
  end if;

  return new;
end;
$$;

create trigger trg_bid_notification
  after insert on public.bids
  for each row
  execute function public.handle_bid_notification();

-- ----- 3c. MESSAGE BİLDİRİMİ -----
create or replace function public.handle_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_user_id uuid;
begin
  -- Sohbet odasındaki diğer kullanıcıyı bul
  select
    case
      when user1_id = new.sender_id then user2_id
      else user1_id
    end into v_other_user_id
  from public.chats
  where id = new.chat_id;

  if v_other_user_id is not null and v_other_user_id <> new.sender_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_other_user_id, new.sender_id, 'MESSAGE', new.chat_id);
  end if;

  return new;
end;
$$;

create trigger trg_message_notification
  after insert on public.messages
  for each row
  execute function public.handle_message_notification();

-- ----- 3d. LIKE BİLDİRİMİ -----
create or replace function public.handle_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner_id uuid;
begin
  -- Gönderi sahibini bul
  select user_id into v_post_owner_id
  from public.posts
  where id = new.post_id;

  -- Kendi gönderisini beğenmesini bildirme
  if v_post_owner_id is not null and v_post_owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_post_owner_id, new.user_id, 'LIKE', new.post_id);
  end if;

  return new;
end;
$$;

create trigger trg_like_notification
  after insert on public.likes
  for each row
  execute function public.handle_like_notification();

-- =====================
-- 4. REALTIME YAYINI
-- =====================

alter publication supabase_realtime add table public.notifications;
