-- ============================================================
-- 013: Yorum Bildirimi
-- COMMENT tipini notifications tablosuna ekler ve
-- comments tablosuna otomatik bildirim trigger'ı kurar.
-- ============================================================

-- 1. Mevcut check constraint'i kaldır
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. COMMENT dahil yeni constraint ekle
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('FOLLOW', 'BID', 'MESSAGE', 'LIKE', 'COMMENT'));

-- 3. Trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id uuid;
BEGIN
  -- Gönderi sahibini bul
  SELECT user_id INTO v_post_owner_id
  FROM public.posts
  WHERE id = new.post_id;

  -- Kendi gönderisine yorum yapmasını bildirme
  IF v_post_owner_id IS NOT NULL AND v_post_owner_id <> new.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (v_post_owner_id, new.user_id, 'COMMENT', new.post_id);
  END IF;

  RETURN new;
END;
$$;

-- 4. Trigger
CREATE TRIGGER trg_comment_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_notification();
