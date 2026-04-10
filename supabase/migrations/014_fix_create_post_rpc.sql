-- ============================================================
-- 014: create_post_with_tags RPC güvenlik düzeltmesi
-- p_user_id parametresini kaldır → auth.uid() kullan
-- SECURITY DEFINER + dışarıdan user_id kabul etmek tehlikeli:
-- doğrudan RPC çağrısında başkası adına post oluşturulabilir.
--
-- ÖNEMLI: Eski 4-parametreli (p_user_id, p_content, p_image_url, p_tags)
-- overload'ı önce DROP et; yoksa PostgreSQL iki farklı imzayı aynı anda
-- tutar ve "function is not unique" hatası verir.
-- ============================================================

DROP FUNCTION IF EXISTS public.create_post_with_tags(uuid, text, text, jsonb);

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
  v_post_id  uuid;
  v_tag      record;
  v_tag_id   uuid;
  v_user_id  uuid := auth.uid();
BEGIN
  -- Kimlik doğrulama zorunlu
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1. Post oluştur
  INSERT INTO posts (user_id, content, image_url)
  VALUES (v_user_id, p_content, p_image_url)
  RETURNING id INTO v_post_id;

  -- 2. Tags varsa işle
  IF p_tags IS NOT NULL AND jsonb_array_length(p_tags) > 0 THEN
    FOR v_tag IN
      SELECT * FROM jsonb_to_recordset(p_tags) AS t(name text, slug text)
    LOOP
      INSERT INTO tags (name, slug)
      VALUES (v_tag.name, v_tag.slug)
      ON CONFLICT (slug) DO NOTHING;

      SELECT id INTO v_tag_id FROM tags WHERE slug = v_tag.slug;

      INSERT INTO post_tags (post_id, tag_id)
      VALUES (v_post_id, v_tag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_post_id;
END;
$$;
