-- Yer imleri gizlilik düzeltmesi
-- Önceki politika SELECT'i herkese açıyordu (using true), bu da kullanıcının hangi
-- gönderileri kaydettiğinin diğer kullanıcılar tarafından okunabilmesine yol açıyordu.
-- Yeni politika: kullanıcı yalnızca kendi yer imlerini okuyabilir.

drop policy if exists "Yer imleri herkese açık" on public.bookmarks;

create policy "bookmarks_select_own"
  on public.bookmarks for select
  using (auth.uid() = user_id);
