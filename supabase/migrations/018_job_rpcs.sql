-- ============================================================
-- 018: Job işlemleri için Supabase RPC fonksiyonları
-- React Native'in server action kullanamayacağından,
-- tüm iş mantığı DB'ye taşınıyor → web de aynı RPC'yi çağırır.
-- ============================================================

-- ── create_job ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_job(
  p_title       text,
  p_description text,
  p_budget      numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job_id  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(trim(p_title)) < 10 THEN
    RAISE EXCEPTION 'Başlık en az 10 karakter olmalıdır.';
  END IF;
  IF length(trim(p_title)) > 200 THEN
    RAISE EXCEPTION 'Başlık en fazla 200 karakter olabilir.';
  END IF;
  IF length(trim(p_description)) < 20 THEN
    RAISE EXCEPTION 'Açıklama en az 20 karakter olmalıdır.';
  END IF;
  IF length(trim(p_description)) > 3000 THEN
    RAISE EXCEPTION 'Açıklama en fazla 3000 karakter olabilir.';
  END IF;
  IF p_budget IS NOT NULL AND p_budget <= 0 THEN
    RAISE EXCEPTION 'Bütçe sıfırdan büyük olmalıdır.';
  END IF;

  INSERT INTO jobs (user_id, title, description, budget)
  VALUES (v_user_id, trim(p_title), trim(p_description), p_budget)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- ── create_bid ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_bid(
  p_job_id        uuid,
  p_amount        numeric,
  p_estimated_days int,
  p_cover_letter  text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_bid_id     uuid;
  v_existing   record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'Teklif tutarı en az 1 TL olmalıdır.';
  END IF;
  IF p_estimated_days < 1 THEN
    RAISE EXCEPTION 'Tahmini süre en az 1 gün olmalıdır.';
  END IF;
  IF length(trim(p_cover_letter)) < 10 THEN
    RAISE EXCEPTION 'Kapak yazısı en az 10 karakter olmalıdır.';
  END IF;
  IF length(trim(p_cover_letter)) > 2000 THEN
    RAISE EXCEPTION 'Kapak yazısı en fazla 2000 karakter olabilir.';
  END IF;

  -- Mevcut teklif kontrolü
  SELECT id, status INTO v_existing
  FROM bids
  WHERE job_id = p_job_id AND expert_id = v_user_id;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status IN ('pending', 'accepted') THEN
      RAISE EXCEPTION 'Zaten aktif bir teklifiniz var.';
    END IF;
    -- rejected → güncelle
    UPDATE bids
    SET amount = p_amount,
        estimated_days = p_estimated_days,
        cover_letter = trim(p_cover_letter),
        status = 'pending'
    WHERE id = v_existing.id
    RETURNING id INTO v_bid_id;
    RETURN v_bid_id;
  END IF;

  -- Yeni teklif
  INSERT INTO bids (job_id, expert_id, amount, estimated_days, cover_letter)
  VALUES (p_job_id, v_user_id, p_amount, p_estimated_days, trim(p_cover_letter))
  RETURNING id INTO v_bid_id;

  RETURN v_bid_id;
END;
$$;

-- ── accept_bid ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_bid(
  p_bid_id uuid,
  p_job_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job     record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id, status INTO v_job FROM jobs WHERE id = p_job_id;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'İlan bulunamadı.';
  END IF;
  IF v_job.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Yalnızca ilan sahibi teklif kabul edebilir.';
  END IF;
  IF v_job.status <> 'open' THEN
    RAISE EXCEPTION 'Bu ilan artık teklif kabul etmiyor.';
  END IF;

  UPDATE bids SET status = 'accepted'
  WHERE id = p_bid_id AND job_id = p_job_id;
  -- DB trigger diğer bid'leri otomatik reddeder
END;
$$;

-- ── reject_bid ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_bid(
  p_bid_id uuid,
  p_job_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job     record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id INTO v_job FROM jobs WHERE id = p_job_id;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'İlan bulunamadı.';
  END IF;
  IF v_job.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Yalnızca ilan sahibi teklif reddedebilir.';
  END IF;

  UPDATE bids SET status = 'rejected'
  WHERE id = p_bid_id AND job_id = p_job_id;
END;
$$;

-- ── update_job_status ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_job_status(
  p_job_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_status NOT IN ('open', 'in_progress', 'closed') THEN
    RAISE EXCEPTION 'Geçersiz durum değeri.';
  END IF;

  UPDATE jobs
  SET status = p_status::text
  WHERE id = p_job_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'İlan bulunamadı veya yetkiniz yok.';
  END IF;
END;
$$;
