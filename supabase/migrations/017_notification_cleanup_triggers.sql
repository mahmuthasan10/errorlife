-- ============================================================
-- 017: Notification Orphan Temizleme Trigger'ları
-- entity_id kolonu FK olmadığı için post/job/chat silindiğinde
-- ilgili notification'lar orphan kalır ve kullanıcı 404 alır.
-- Bu trigger'lar silme işlemi öncesinde temizlik yapar.
-- ============================================================

-- ── Post silindiğinde LIKE ve COMMENT notification'larını temizle ──
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_post_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE entity_id = OLD.id
    AND type IN ('LIKE', 'COMMENT');
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_post_notifications ON public.posts;

CREATE TRIGGER trg_cleanup_post_notifications
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_post_delete();


-- ── Chat silindiğinde MESSAGE notification'larını temizle ──
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_chat_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE entity_id = OLD.id
    AND type = 'MESSAGE';
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_chat_notifications ON public.chats;

CREATE TRIGGER trg_cleanup_chat_notifications
  BEFORE DELETE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_chat_delete();


-- ── Job silindiğinde BID notification'larını temizle ──
-- Bids job silinince CASCADE ile silinir; ancak notifications
-- bids.id'ye referans verdiğinden önce notifications temizlenmeli.
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_job_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE type = 'BID'
    AND entity_id IN (
      SELECT id FROM public.bids WHERE job_id = OLD.id
    );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_job_notifications ON public.jobs;

CREATE TRIGGER trg_cleanup_job_notifications
  BEFORE DELETE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_job_delete();
