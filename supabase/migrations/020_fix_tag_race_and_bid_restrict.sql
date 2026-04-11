-- ============================================================
-- 020: Tag Race Condition Düzeltmesi + Bid Alan Kısıtlaması
-- ============================================================

-- ── Düzeltme 1: create_post_with_tags() tag race condition ──
-- Sorun: INSERT ... ON CONFLICT DO NOTHING + ayrı SELECT kullanımı.
-- Arada başka bir işlem tag'i silerse SELECT NULL döndürür → FK ihlali.
-- Çözüm: ON CONFLICT DO UPDATE + RETURNING ile tek seferde ID al.

CREATE OR REPLACE FUNCTION public.create_post_with_tags(
  p_content   text,
  p_image_url text    DEFAULT NULL,
  p_tags      jsonb   DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_post_id  uuid;
  v_tag      record;
  v_tag_id   uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_content IS NULL OR trim(p_content) = '' THEN
    RAISE EXCEPTION 'Gönderi içeriği boş olamaz.';
  END IF;
  IF char_length(trim(p_content)) > 500 THEN
    RAISE EXCEPTION 'Gönderi içeriği 500 karakteri geçemez.';
  END IF;

  -- 1. Post oluştur
  INSERT INTO posts (user_id, content, image_url)
  VALUES (v_user_id, trim(p_content), p_image_url)
  RETURNING id INTO v_post_id;

  -- 2. Tags varsa işle
  IF p_tags IS NOT NULL AND jsonb_array_length(p_tags) > 0 THEN
    FOR v_tag IN
      SELECT * FROM jsonb_to_recordset(p_tags) AS t(name text, slug text)
    LOOP
      -- DO UPDATE kullanarak RETURNING her zaman ID döndürür.
      -- Eş zamanlı silme/insert senaryosunda NULL almak mümkün değil.
      INSERT INTO tags (name, slug)
      VALUES (v_tag.name, v_tag.slug)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO v_tag_id;

      INSERT INTO post_tags (post_id, tag_id)
      VALUES (v_post_id, v_tag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_post_id;
END;
$$;


-- ── Düzeltme 2: Bid Alan Kısıtlama Trigger'ı ──
-- Sorun: RLS politikası ilan sahibinin teklif tutarını (amount),
-- kapak mektubunu (cover_letter) vb. güncellemesine izin veriyor.
-- messages tablosunda restrict_message_update() var ama bids için yok.
-- Çözüm: Kabul/red işlemi dışında hiçbir alanın değiştirilememesi.

CREATE OR REPLACE FUNCTION public.restrict_bid_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Değiştirilemeyen alanları her zaman eski değere sabitle
  NEW.user_id      := OLD.user_id;
  NEW.job_id       := OLD.job_id;
  NEW.amount       := OLD.amount;
  NEW.estimated_days := OLD.estimated_days;
  NEW.cover_letter := OLD.cover_letter;
  NEW.created_at   := OLD.created_at;
  -- status ve updated_at değiştirilebilir (kabul/red işlemi için)
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_bid_update ON public.bids;

CREATE TRIGGER trg_restrict_bid_update
  BEFORE UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_bid_update();
