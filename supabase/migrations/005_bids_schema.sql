-- ============================================================
-- 005: Bids (Teklifler) Tablosu, RLS, Trigger & Realtime
-- ============================================================

-- 1) Tablo
create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  expert_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  estimated_days int not null,
  cover_letter text not null check (char_length(cover_letter) > 0 and char_length(cover_letter) <= 2000),
  status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Bir uzman ayni ilana birden fazla teklif veremesin
  unique (job_id, expert_id)
);

-- Indeksler
create index bids_job_id_idx on public.bids(job_id);
create index bids_expert_id_idx on public.bids(expert_id);
create index bids_status_idx on public.bids(status);

-- updated_at otomatik guncelleme
create trigger set_bids_updated_at
  before update on public.bids
  for each row
  execute function public.handle_updated_at();

-- 2) RLS
alter table public.bids enable row level security;

-- Herkes ilanlarin tekliflerini okuyabilir
create policy "Bids are viewable by everyone"
  on public.bids for select
  using (true);

-- Giris yapan kullanici teklif verebilir (kendi ilani degilse)
create policy "Authenticated users can create bids on others jobs"
  on public.bids for insert
  with check (
    auth.uid() = expert_id
    and not exists (
      select 1 from public.jobs where id = job_id and user_id = auth.uid()
    )
  );

-- Kullanici kendi teklifini guncelleyebilir
create policy "Users can update own bids"
  on public.bids for update
  using (auth.uid() = expert_id);

-- Kullanici kendi teklifini silebilir
create policy "Users can delete own bids"
  on public.bids for delete
  using (auth.uid() = expert_id);

-- 3) Akilli Trigger — State Machine
-- Bir bid 'accepted' olarak guncellendiginde:
--   a) Ilgili job'un statusunu 'in_progress' yap
--   b) Ayni job'a ait diger teklifleri 'rejected' yap
create or replace function public.handle_bid_accepted()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Sadece status 'accepted' olarak degistiginde calis
  if new.status = 'accepted' and old.status <> 'accepted' then
    -- a) Ilani in_progress yap
    update public.jobs
      set status = 'in_progress', updated_at = now()
      where id = new.job_id;

    -- b) Ayni ilandaki diger teklifleri reddet
    update public.bids
      set status = 'rejected', updated_at = now()
      where job_id = new.job_id
        and id <> new.id
        and status = 'pending';
  end if;

  return new;
end;
$$;

create trigger on_bid_accepted
  after update on public.bids
  for each row
  execute function public.handle_bid_accepted();

-- 4) Realtime
alter publication supabase_realtime add table public.bids;
