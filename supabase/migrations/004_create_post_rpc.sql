-- ============================================
-- create_post_with_tags: Post + Tag ilişkisini
-- tek bir transaction içinde atomik olarak oluşturur.
-- Herhangi bir adımda hata olursa tüm işlem rollback olur.
-- SECURITY DEFINER: RLS'yi bypass eder (sunucu tarafında çağrılır).
-- ============================================

create or replace function public.create_post_with_tags(
  p_user_id uuid,
  p_content text,
  p_image_url text default null,
  p_tags jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_tag record;
  v_tag_id uuid;
begin
  -- 1. Post oluştur
  insert into posts (user_id, content, image_url)
  values (p_user_id, p_content, p_image_url)
  returning id into v_post_id;

  -- 2. Tags varsa işle
  if p_tags is not null and jsonb_array_length(p_tags) > 0 then
    for v_tag in select * from jsonb_to_recordset(p_tags) as t(name text, slug text)
    loop
      -- Tag yoksa ekle, varsa atla
      insert into tags (name, slug)
      values (v_tag.name, v_tag.slug)
      on conflict (slug) do nothing;

      -- Tag ID'sini al (yeni veya mevcut)
      select id into v_tag_id from tags where slug = v_tag.slug;

      -- Post-Tag ilişkisini kur
      insert into post_tags (post_id, tag_id)
      values (v_post_id, v_tag_id)
      on conflict do nothing;
    end loop;
  end if;

  return v_post_id;
end;
$$;
