-- ============================================================
-- 021_advanced_notifications_aggregation.sql
-- 3-sekmeli bildirim sistemi için RPC fonksiyonları.
--
-- 1. get_interaction_notifications()
--    COMMENT → tek tek   |   LIKE → post bazında gruplanmış
--    auth.uid() ile çalışır, SECURITY DEFINER → RLS bypass gerek yok.
--
-- 2. get_follow_notifications()
--    Sadece FOLLOW tipi bildirimler.
--
-- 3. get_message_notifications()
--    Doğrudan chats + messages tablolarından beslenir.
--    notifications tablosuna veri kopyalamaz.
--
-- 4. mark_like_notifications_read(p_post_id)
--    Bir post için tüm LIKE bildirimlerini okundu işaretler.
-- ============================================================


-- ── 1. ETKİLEŞİMLER: Yorumlar (bireysel) + Beğeniler (gruplanmış) ──

DROP FUNCTION IF EXISTS get_interaction_notifications();

CREATE OR REPLACE FUNCTION get_interaction_notifications()
RETURNS TABLE (
  kind                     text,
  notification_id          uuid,
  post_id                  uuid,
  is_read                  boolean,
  latest_at                timestamptz,
  actor_count              bigint,
  latest_actor_id          uuid,
  latest_actor_display_name text,
  latest_actor_username    text,
  latest_actor_avatar_url  text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Yorumlar: her bildirim ayrı satır
  SELECT
    'comment'::text                     AS kind,
    n.id                                AS notification_id,
    n.entity_id                         AS post_id,
    n.is_read,
    n.created_at                        AS latest_at,
    1::bigint                           AS actor_count,
    n.actor_id                          AS latest_actor_id,
    p.display_name                      AS latest_actor_display_name,
    p.username                          AS latest_actor_username,
    p.avatar_url                        AS latest_actor_avatar_url
  FROM notifications n
  JOIN profiles p ON p.id = n.actor_id
  WHERE n.user_id = auth.uid()
    AND n.type = 'COMMENT'
    AND n.entity_id IS NOT NULL

  UNION ALL

  -- Beğeniler: post_id bazında gruplanmış, en son beğenen ilk
  SELECT
    'like'::text                                                          AS kind,
    NULL::uuid                                                            AS notification_id,
    n.entity_id                                                           AS post_id,
    -- Tüm beğeniler okunmuşsa okundu, aksi hâlde okunmadı
    BOOL_AND(n.is_read)                                                   AS is_read,
    MAX(n.created_at)                                                     AS latest_at,
    COUNT(*)::bigint                                                      AS actor_count,
    (ARRAY_AGG(n.actor_id      ORDER BY n.created_at DESC))[1]           AS latest_actor_id,
    (ARRAY_AGG(p.display_name  ORDER BY n.created_at DESC))[1]           AS latest_actor_display_name,
    (ARRAY_AGG(p.username      ORDER BY n.created_at DESC))[1]           AS latest_actor_username,
    (ARRAY_AGG(p.avatar_url    ORDER BY n.created_at DESC))[1]           AS latest_actor_avatar_url
  FROM notifications n
  JOIN profiles p ON p.id = n.actor_id
  WHERE n.user_id = auth.uid()
    AND n.type = 'LIKE'
    AND n.entity_id IS NOT NULL
  GROUP BY n.entity_id

  ORDER BY latest_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_interaction_notifications() TO authenticated;


-- ── 2. TAKİPLER ─────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_follow_notifications();

CREATE OR REPLACE FUNCTION get_follow_notifications()
RETURNS TABLE (
  notification_id          uuid,
  actor_id                 uuid,
  is_read                  boolean,
  created_at               timestamptz,
  actor_display_name       text,
  actor_username           text,
  actor_avatar_url         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.id                AS notification_id,
    n.actor_id,
    n.is_read,
    n.created_at,
    p.display_name      AS actor_display_name,
    p.username          AS actor_username,
    p.avatar_url        AS actor_avatar_url
  FROM notifications n
  JOIN profiles p ON p.id = n.actor_id
  WHERE n.user_id = auth.uid()
    AND n.type = 'FOLLOW'
  ORDER BY n.created_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_follow_notifications() TO authenticated;


-- ── 3. MESAJLAR (chat_schema'dan doğrudan) ───────────────────────────
-- notifications tablosuna kopyalama YOK, veri tekrarı YOK.

DROP FUNCTION IF EXISTS get_message_notifications();

CREATE OR REPLACE FUNCTION get_message_notifications()
RETURNS TABLE (
  chat_id                  uuid,
  other_user_id            uuid,
  other_user_display_name  text,
  other_user_username      text,
  other_user_avatar_url    text,
  last_message_content     text,
  last_message_at          timestamptz,
  unread_count             bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_chats AS (
    -- Kullanıcının dahil olduğu sohbetler
    SELECT
      c.id                                                          AS chat_id,
      CASE WHEN c.user1_id = auth.uid() THEN c.user2_id
           ELSE c.user1_id END                                      AS other_user_id,
      c.created_at                                                  AS chat_created_at
    FROM chats c
    WHERE c.user1_id = auth.uid()
       OR c.user2_id = auth.uid()
  ),
  last_messages AS (
    -- Her sohbet için en son mesaj (DISTINCT ON performans için)
    SELECT DISTINCT ON (m.chat_id)
      m.chat_id,
      m.content,
      m.created_at,
      m.sender_id
    FROM messages m
    WHERE m.chat_id IN (SELECT chat_id FROM user_chats)
    ORDER BY m.chat_id, m.created_at DESC
  ),
  unread_counts AS (
    -- Karşı taraftan gelen okunmamış mesaj sayısı
    SELECT
      m.chat_id,
      COUNT(*) AS cnt
    FROM messages m
    WHERE m.chat_id IN (SELECT chat_id FROM user_chats)
      AND m.sender_id != auth.uid()
      AND m.is_read = false
    GROUP BY m.chat_id
  )
  SELECT
    uc.chat_id,
    uc.other_user_id,
    p.display_name  AS other_user_display_name,
    p.username      AS other_user_username,
    p.avatar_url    AS other_user_avatar_url,
    lm.content      AS last_message_content,
    lm.created_at   AS last_message_at,
    COALESCE(u.cnt, 0) AS unread_count
  FROM user_chats uc
  JOIN profiles p         ON p.id = uc.other_user_id
  LEFT JOIN last_messages lm ON lm.chat_id = uc.chat_id
  LEFT JOIN unread_counts u  ON u.chat_id  = uc.chat_id
  ORDER BY COALESCE(lm.created_at, uc.chat_created_at) DESC
  LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION get_message_notifications() TO authenticated;


-- ── 4. Beğeni grubunu toplu okundu işaretle ─────────────────────────

DROP FUNCTION IF EXISTS mark_like_notifications_read(uuid);

CREATE OR REPLACE FUNCTION mark_like_notifications_read(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET is_read = true
  WHERE user_id    = auth.uid()
    AND entity_id  = p_post_id
    AND type       = 'LIKE'
    AND is_read    = false;
$$;

GRANT EXECUTE ON FUNCTION mark_like_notifications_read(uuid) TO authenticated;
