-- ============================================================
-- 025_fix_bid_restrict_trigger.sql
--
-- Hata: restrict_bid_update() trigger fonksiyonu
-- Migration 020'de NEW.user_id := OLD.user_id yazıldı,
-- ancak bids tablosunda user_id kolonu yok — tablo expert_id kullanıyor.
-- Bu typo, accept_bid ve reject_bid çağrıldığında
-- "record 'new' has no field 'user_id'" hatası vererek
-- tüm teklif kabul/red işlemlerini başarısız kılıyordu.
--
-- Düzeltme: user_id → expert_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.restrict_bid_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Değiştirilemeyen alanları her zaman eski değere sabitle.
  -- NOT: bids tablosunda user_id kolonu YOK; bidder kolonu expert_id'dir.
  NEW.expert_id      := OLD.expert_id;
  NEW.job_id         := OLD.job_id;
  NEW.amount         := OLD.amount;
  NEW.estimated_days := OLD.estimated_days;
  NEW.cover_letter   := OLD.cover_letter;
  NEW.created_at     := OLD.created_at;
  -- status ve updated_at değiştirilebilir (kabul/red işlemi için)
  RETURN NEW;
END;
$$;
