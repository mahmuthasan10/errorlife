-- ============================================
-- ErrorLife - DM (Direkt Mesajlasma) Semasi (Hafta 7)
-- ============================================

-- ============================================
-- 1. CHATS tablosu (sohbet odalari)
-- ============================================
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,

  -- Ayni kullanicinin kendisiyle sohbet acmasini engelle
  constraint chats_no_self_chat check (user1_id <> user2_id),

  -- user1_id her zaman kucuk UUID olacak sekilde unique constraint
  -- Bu sayede (A,B) ve (B,A) cifte kayit olusturamaz
  constraint chats_unique_pair unique (user1_id, user2_id)
);

-- user1_id'nin her zaman kucuk UUID olmasini garanti eden trigger
-- Frontend'in hangi sirayla gonderdigi onemli degil, DB kendisi duzeltir
create or replace function public.order_chat_users()
returns trigger as $$
begin
  if new.user1_id > new.user2_id then
    -- Yer degistir
    declare tmp uuid;
    begin
      tmp := new.user1_id;
      new.user1_id := new.user2_id;
      new.user2_id := tmp;
    end;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_order_chat_users
  before insert on public.chats
  for each row
  execute function public.order_chat_users();

-- Hizli sorgulama icin indexler
create index chats_user1_idx on public.chats (user1_id);
create index chats_user2_idx on public.chats (user2_id);

-- ============================================
-- 2. MESSAGES tablosu
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

-- Hizli sorgulama icin indexler
create index messages_chat_id_idx on public.messages (chat_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

-- ============================================
-- 3. RLS POLITIKALARI - CHATS
-- ============================================
alter table public.chats enable row level security;

-- SELECT: Kullanici sadece kendi sohbet odalarini gorebilir
create policy "Kullanici kendi sohbetlerini gorur"
  on public.chats for select
  using (
    auth.uid() = user1_id or auth.uid() = user2_id
  );

-- INSERT: Kullanici sadece kendisinin dahil oldugu sohbet olusturabilir
create policy "Kullanici kendi sohbetini olusturur"
  on public.chats for insert
  with check (
    auth.uid() = user1_id or auth.uid() = user2_id
  );

-- DELETE: Kullanici kendi sohbetini silebilir
create policy "Kullanici kendi sohbetini silebilir"
  on public.chats for delete
  using (
    auth.uid() = user1_id or auth.uid() = user2_id
  );

-- ============================================
-- 4. RLS POLITIKALARI - MESSAGES
-- ============================================
alter table public.messages enable row level security;

-- SELECT: Kullanici sadece uye oldugu sohbetteki mesajlari gorebilir
create policy "Kullanici kendi sohbet mesajlarini gorur"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.user1_id = auth.uid() or chats.user2_id = auth.uid())
    )
  );

-- INSERT: Kullanici sadece uye oldugu sohbete ve sadece kendi adiyla mesaj atabilir
create policy "Kullanici kendi adiyla mesaj gonderir"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.user1_id = auth.uid() or chats.user2_id = auth.uid())
    )
  );

-- UPDATE: Kullanici sadece kendisine gelen mesajlari okundu olarak isaretleyebilir
create policy "Kullanici gelen mesajlari okundu isaretler"
  on public.messages for update
  using (
    -- Mesaj kendisine gelmis olmali (gonderen degil, alan)
    sender_id <> auth.uid()
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.user1_id = auth.uid() or chats.user2_id = auth.uid())
    )
  )
  with check (
    -- Sadece is_read alanini degistirebilir
    sender_id <> auth.uid()
  );

-- ============================================
-- 5. REALTIME YAYINI
-- ============================================
-- messages tablosunu Supabase Realtime publication'a ekle
alter publication supabase_realtime add table public.messages;
