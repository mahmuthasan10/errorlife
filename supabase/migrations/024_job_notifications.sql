-- ============================================================
-- 024_job_notifications.sql
--
-- "İlanlar" sekmesi için bildirim altyapısı:
--   1. CHECK constraint'e BID_ACCEPTED + BID_REJECTED tipleri eklenir
--   2. bids.status değişikliğinde teklif sahibine bildirim trigger'ı
--   3. get_job_notifications() RPC — 3 tipi de tek liste hâlinde
--      jobs.title ile birlikte döndürür
-- ============================================================

-- ── 1. CHECK constraint güncelle ──────────────────────────────

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'FOLLOW',
    'BID',
    'MESSAGE',
    'LIKE',
    'COMMENT',
    'BID_ACCEPTED',
    'BID_REJECTED'
  ));


-- ── 2. Teklif kabul/red trigger'ı ─────────────────────────────
-- bids.status pending → accepted veya pending → rejected'a geçince
-- teklif sahibine (expert_id) ilan sahibinden bildirim düşer.

CREATE OR REPLACE FUNCTION public.handle_bid_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_owner_id uuid;
  v_notif_type   text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_job_owner_id
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF v_job_owner_id IS NULL OR v_job_owner_id = NEW.expert_id THEN
    RETURN NEW;
  END IF;

  v_notif_type := CASE
    WHEN NEW.status = 'accepted' THEN 'BID_ACCEPTED'
    ELSE 'BID_REJECTED'
  END;

  INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
  VALUES (NEW.expert_id, v_job_owner_id, v_notif_type, NEW.job_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bid_status_notification ON public.bids;

CREATE TRIGGER trg_bid_status_notification
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bid_status_notification();


-- ── 3. İlan Bildirimleri RPC'si ───────────────────────────────
-- BID, BID_ACCEPTED, BID_REJECTED tiplerini tek listede,
-- ilan başlığıyla birlikte döndürür. Tıklayınca /jobs/[id]'ye gidilebilir.

DROP FUNCTION IF EXISTS get_job_notifications();

CREATE OR REPLACE FUNCTION get_job_notifications()
RETURNS TABLE (
  notification_id     uuid,
  type                text,
  is_read             boolean,
  created_at          timestamptz,
  job_id              uuid,
  job_title           text,
  actor_id            uuid,
  actor_display_name  text,
  actor_username      text,
  actor_avatar_url    text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.id                                                        AS notification_id,
    n.type,
    n.is_read,
    n.created_at,
    -- BID için entity_id = bid.id → bids.job_id ile join
    -- BID_ACCEPTED/REJECTED için entity_id = job.id (direkt)
    CASE WHEN n.type = 'BID' THEN b.job_id ELSE n.entity_id END AS job_id,
    j.title                                                     AS job_title,
    n.actor_id,
    p.display_name                                              AS actor_display_name,
    p.username                                                  AS actor_username,
    p.avatar_url                                                AS actor_avatar_url
  FROM notifications n
  JOIN profiles p ON p.id = n.actor_id
  LEFT JOIN bids b ON b.id = n.entity_id AND n.type = 'BID'
  LEFT JOIN jobs j
    ON j.id = CASE WHEN n.type = 'BID' THEN b.job_id ELSE n.entity_id END
  WHERE n.user_id = auth.uid()
    AND n.type IN ('BID', 'BID_ACCEPTED', 'BID_REJECTED')
  ORDER BY n.created_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_job_notifications() TO authenticated;
