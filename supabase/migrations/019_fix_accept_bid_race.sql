-- ============================================================
-- 019: accept_bid() Race Condition Düzeltmesi
-- Sorun: İki kullanıcı aynı anda farklı teklif kabul etmeye çalışırsa
-- SELECT'te kilit olmadığı için her ikisi de job'ı 'open' görüp
-- kendi teklifini kabul ediyor. Sonuç: aynı ilanda 2 accepted bid.
-- Çözüm: SELECT ... FOR UPDATE ile job satırını kilitle.
-- ============================================================

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

  -- FOR UPDATE: job satırını kilitle — eş zamanlı accept_bid çağrıları sıralanır.
  -- Birinci çağrı kilidi aldıktan sonra status'u 'in_progress' yapar;
  -- ikinci çağrı kilidi aldığında status artık 'open' değil → EXCEPTION atar.
  SELECT user_id, status INTO v_job
  FROM jobs WHERE id = p_job_id
  FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'İlan bulunamadı.';
  END IF;
  IF v_job.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Yalnızca ilan sahibi teklif kabul edebilir.';
  END IF;
  IF v_job.status <> 'open' THEN
    RAISE EXCEPTION 'Bu ilan artık teklif kabul etmiyor.';
  END IF;

  -- status = 'pending' koşulu: zaten işlem görmüş teklifi tekrar kabul etmeyi engelle
  UPDATE bids SET status = 'accepted'
  WHERE id = p_bid_id AND job_id = p_job_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Teklif bulunamadı veya zaten işlem görmüş.';
  END IF;

  -- DB trigger (005: on_bid_accepted) diğer bid'leri otomatik reddeder
  -- ve job status'unu 'in_progress' yapar.
END;
$$;
