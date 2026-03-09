-- İlan sahibinin, kendi ilanına gelen teklifleri (bids) güncelleyebilmesi (kabul/red) için gerekli RLS politikası:
CREATE POLICY "İlan sahibi teklifin durumunu güncelleyebilir"
  ON public.bids
  FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.jobs WHERE id = bids.job_id)
  );
