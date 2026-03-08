-- ============================================
-- tags tablosuna INSERT politikası ekle
-- Authenticated kullanıcılar yeni etiket oluşturabilsin
-- ============================================

create policy "Giriş yapan kullanıcılar etiket ekleyebilir"
  on public.tags for insert
  with check (auth.role() = 'authenticated');
