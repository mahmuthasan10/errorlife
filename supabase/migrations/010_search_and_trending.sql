-- ── Trending Tags RPC ─────────────────────────────────────────────────────────
-- post_tags ile tags'i join'leyip GROUP BY ile sayar, post sayısına göre sıralar

CREATE OR REPLACE FUNCTION public.get_trending_tags(p_limit int DEFAULT 10)
RETURNS TABLE (
  id   uuid,
  name text,
  slug text,
  post_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.name,
    t.slug,
    COUNT(pt.post_id) AS post_count
  FROM public.tags t
  LEFT JOIN public.post_tags pt ON pt.tag_id = t.id
  GROUP BY t.id, t.name, t.slug
  ORDER BY post_count DESC, t.name ASC
  LIMIT p_limit;
$$;

-- ── Full-Text Search: Posts ────────────────────────────────────────────────────
-- posts.content üzerine GIN index (basit dictionary, Türkçe/İngilizce karışık içerik için uygun)

CREATE INDEX IF NOT EXISTS posts_content_search_idx
  ON public.posts
  USING gin(to_tsvector('simple', content));

-- Post arama RPC: full-text search + tag slug filtresi
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
      OR p.content ILIKE '%' || p_query || '%'
    )
    AND (
      p_tag = ''
      OR t.slug = p_tag
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ── User Search RPC ────────────────────────────────────────────────────────────
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
    OR username     ILIKE '%' || p_query || '%'
    OR display_name ILIKE '%' || p_query || '%'
  ORDER BY followers_count DESC, created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ── Job Search RPC ─────────────────────────────────────────────────────────────
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
      OR j.title       ILIKE '%' || p_query || '%'
      OR j.description ILIKE '%' || p_query || '%'
    )
    AND (
      p_tag = ''
      OR t.slug = p_tag
    )
  ORDER BY j.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
