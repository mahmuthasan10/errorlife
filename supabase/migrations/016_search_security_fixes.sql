-- ============================================================
-- 016: Search RPC Güvenlik Düzeltmeleri
-- a) ILIKE wildcard karakterleri (%, _) escape edilir
-- b) p_limit maksimum 100 ile sınırlandırılır
-- c) p_offset negatif olamaz
-- ============================================================

-- ── search_posts ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_posts(
  p_query   text    DEFAULT '',
  p_tag     text    DEFAULT '',
  p_limit   int     DEFAULT 20,
  p_offset  int     DEFAULT 0
)
RETURNS TABLE (
  id             uuid,
  user_id        uuid,
  content        text,
  image_url      text,
  like_count     int,
  comment_count  int,
  bookmark_count int,
  created_at     timestamptz,
  updated_at     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query  text := '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_limit  int  := LEAST(GREATEST(p_limit, 1), 100);
  v_offset int  := GREATEST(p_offset, 0);
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.like_count,
    p.comment_count,
    p.bookmark_count,
    p.created_at,
    p.updated_at
  FROM public.posts p
  LEFT JOIN public.post_tags pt ON pt.post_id = p.id
  LEFT JOIN public.tags t       ON t.id = pt.tag_id
  WHERE
    (
      p_query = ''
      OR to_tsvector('simple', p.content) @@ plainto_tsquery('simple', p_query)
      OR p.content ILIKE v_query ESCAPE '\'
    )
    AND (
      p_tag = ''
      OR t.slug = p_tag
    )
  ORDER BY p.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;


-- ── search_users ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_users(
  p_query  text  DEFAULT '',
  p_limit  int   DEFAULT 20,
  p_offset int   DEFAULT 0
)
RETURNS TABLE (
  id              uuid,
  username        text,
  display_name    text,
  avatar_url      text,
  bio             text,
  followers_count int,
  following_count int,
  created_at      timestamptz,
  updated_at      timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query  text := '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_limit  int  := LEAST(GREATEST(p_limit, 1), 100);
  v_offset int  := GREATEST(p_offset, 0);
BEGIN
  RETURN QUERY
  SELECT
    id,
    username,
    display_name,
    avatar_url,
    bio,
    followers_count,
    following_count,
    created_at,
    updated_at
  FROM public.profiles
  WHERE
    p_query = ''
    OR username     ILIKE v_query ESCAPE '\'
    OR display_name ILIKE v_query ESCAPE '\'
  ORDER BY followers_count DESC, created_at ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;


-- ── search_jobs ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_jobs(
  p_query  text  DEFAULT '',
  p_tag    text  DEFAULT '',
  p_limit  int   DEFAULT 20,
  p_offset int   DEFAULT 0
)
RETURNS TABLE (
  id          uuid,
  user_id     uuid,
  title       text,
  description text,
  budget      numeric,
  status      text,
  created_at  timestamptz,
  updated_at  timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query  text := '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_limit  int  := LEAST(GREATEST(p_limit, 1), 100);
  v_offset int  := GREATEST(p_offset, 0);
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    j.id,
    j.user_id,
    j.title,
    j.description,
    j.budget,
    j.status::text,
    j.created_at,
    j.updated_at
  FROM public.jobs j
  LEFT JOIN public.job_tags jt ON jt.job_id = j.id
  LEFT JOIN public.tags t      ON t.id = jt.tag_id
  WHERE
    j.status = 'open'
    AND (
      p_query = ''
      OR j.title       ILIKE v_query ESCAPE '\'
      OR j.description ILIKE v_query ESCAPE '\'
    )
    AND (
      p_tag = ''
      OR t.slug = p_tag
    )
  ORDER BY j.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;
