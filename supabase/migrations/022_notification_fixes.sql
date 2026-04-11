-- ============================================================
-- 022_notification_fixes.sql
--
-- 1. get_follow_notifications() — aktif takipçi kontrolü +
--    her kişiden sadece en son takip bildirimi (DISTINCT ON)
--
-- 2. get_message_notifications() — last_message_content
--    olarak sadece KARŞI TARAFIN gönderdiği son mesajı döndür
--
-- 3. get_badge_counts() — sidebar / bottom-nav badge'leri için
--    tek round-trip'te okunmamış bildirim sayısı ve
--    okunmamış mesajı olan farklı sohbet sayısı
-- ============================================================


-- ── 1. Takip Bildirimleri (güncelleme) ───────────────────────
-- • follows tablosuyla JOIN → takibi bırakanlar filtrelenir
-- • DISTINCT ON (actor_id) → her kişiden sadece en yeni bildirim

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
  SELECT DISTINCT ON (n.actor_id)
    n.id          AS notification_id,
    n.actor_id,
    n.is_read,
    n.created_at,
    p.display_name AS actor_display_name,
    p.username     AS actor_username,
    p.avatar_url   AS actor_avatar_url
  FROM notifications n
  JOIN profiles p ON p.id = n.actor_id
  -- Sadece hâlâ aktif takipçileri göster
  JOIN follows f
    ON f.follower_id = n.actor_id
   AND f.following_id = auth.uid()
  WHERE n.user_id = auth.uid()
    AND n.type = 'FOLLOW'
  -- DISTINCT ON için önce actor_id, sonra en yeni tarih
  ORDER BY n.actor_id, n.created_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_follow_notifications() TO authenticated;


-- ── 2. Mesaj Bildirimleri (güncelleme) ───────────────────────
-- last_message_content / last_message_at olarak sadece
-- karşı tarafın attığı son mesajı döndür.

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
    SELECT
      c.id AS chat_id,
      CASE WHEN c.user1_id = auth.uid() THEN c.user2_id
           ELSE c.user1_id END AS other_user_id,
      c.created_at AS chat_created_at
    FROM chats c
    WHERE c.user1_id = auth.uid()
       OR c.user2_id = auth.uid()
  ),
  -- Sadece KARŞI TARAFIN gönderdiği son mesaj
  last_messages AS (
    SELECT DISTINCT ON (m.chat_id)
      m.chat_id,
      m.content,
      m.created_at
    FROM messages m
    WHERE m.chat_id IN (SELECT chat_id FROM user_chats)
      AND m.sender_id != auth.uid()
    ORDER BY m.chat_id, m.created_at DESC
  ),
  unread_counts AS (
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
  JOIN profiles p           ON p.id  = uc.other_user_id
  LEFT JOIN last_messages lm ON lm.chat_id = uc.chat_id
  LEFT JOIN unread_counts u  ON u.chat_id  = uc.chat_id
  -- Karşı taraftan hiç mesaj gelmemişse listeye alma
  WHERE lm.chat_id IS NOT NULL
  ORDER BY lm.created_at DESC
  LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION get_message_notifications() TO authenticated;


-- ── 3. Badge Sayaçları (yeni) ─────────────────────────────────
-- Sidebar / bottom-nav için tek sorguda iki sayaç.

DROP FUNCTION IF EXISTS get_badge_counts();

CREATE OR REPLACE FUNCTION get_badge_counts()
RETURNS TABLE (notif_count bigint, message_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Okunmamış bildirim sayısı (MESSAGE tipi hariç — mesajlar ayrı)
    (
      SELECT COUNT(*)
      FROM notifications
      WHERE user_id = auth.uid()
        AND is_read  = false
        AND type    != 'MESSAGE'
    ) AS notif_count,

    -- Okunmamış mesajı olan farklı sohbet sayısı
    (
      SELECT COUNT(DISTINCT m.chat_id)
      FROM messages m
      JOIN chats c ON c.id = m.chat_id
      WHERE (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        AND m.sender_id != auth.uid()
        AND m.is_read   = false
    ) AS message_count;
$$;

GRANT EXECUTE ON FUNCTION get_badge_counts() TO authenticated;
