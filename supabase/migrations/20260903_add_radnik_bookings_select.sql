-- Radnik treba vidjeti rezervacije da bi dobio rutu dostave na /radnik.
-- Do sada je postojala samo "Admins can view all bookings" SELECT politika,
-- pa je radnik-only racun dobivao 0 redaka (RLS bez odgovarajuceg SELECT
-- policyja vraca prazan rezultat, ne gresku).
CREATE POLICY "Radnici can view bookings" ON public.bookings
FOR SELECT USING (public.has_role(auth.uid(), 'radnik'));
