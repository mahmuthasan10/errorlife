-- ============================================================
-- 015: Güvenlik Düzeltmeleri
-- a) bids UPDATE policy → WITH CHECK eklendi
-- b) messages UPDATE → değiştirilemez kolon kısıtlaması
-- ============================================================

-- ── a) Bids RLS: WITH CHECK ──────────────────────────────────
-- Eski policy'yi düşür, WITH CHECK ile yeniden oluştur.
-- Böylece ilan sahibi güncellenen satırın da sahibi olduğunu
-- doğrulamak zorunda kalır; job_id / expert_id gibi alanlar
-- değiştirilemez hale gelir.

DROP POLICY IF EXISTS "İlan sahibi teklifin durumunu güncelleyebilir" ON public.bids;

CREATE POLICY "İlan sahibi teklifin durumunu güncelleyebilir"
  ON public.bids
  FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.jobs WHERE id = bids.job_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.jobs WHERE id = bids.job_id)
  );


-- ── b) Messages: değiştirilemez kolon trigger'ı ──────────────
-- PostgreSQL kolon bazlı RLS desteklemez; bu nedenle BEFORE UPDATE
-- trigger'ı ile content, sender_id, chat_id, created_at alanları
-- her zaman eski değere geri döndürülür.
-- Alıcı sadece is_read alanını güncelleyebilir.

CREATE OR REPLACE FUNCTION public.restrict_message_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content    := OLD.content;
  NEW.sender_id  := OLD.sender_id;
  NEW.chat_id    := OLD.chat_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_message_update ON public.messages;

CREATE TRIGGER trg_restrict_message_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_message_update();
