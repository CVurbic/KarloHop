-- Handoff između jutarnje (dostava) i popodnevne (skupljanje) smjene.
-- Do sada je sve što radnik zabilježi na lokaciji (klinovi, napomena, foto)
-- živjelo samo u localStorage tog mobitela (TripCard.tsx) -> druga smjena / drugi
-- uređaj nije vidio ništa. Ova tablica je jedini dijeljeni zapis po rezervaciji:
-- dostava puni delivery_*, skupljanje čita + puni pickup_*.
-- Zasebna tablica (ne kolone na bookings) jer radnik na bookings smije samo SELECT
-- -- ovdje mu dajemo INSERT/UPDATE bez da može dirati cijenu/adresu/status.

CREATE TABLE IF NOT EXISTS public.booking_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- dostava (jutarnja smjena)
  klinovi_count smallint,                            -- koliko klinova zabijeno u zemlju -> skupljanje zna koliko izvaditi
  delivery_note text,                                -- "pas u dvorištu", "ostavljeno kod susjeda 5a"
  delivery_photo_paths text[] NOT NULL DEFAULT '{}', -- path-evi u bucketu radnik-photos (privatan)
  delivered_at timestamptz,
  delivered_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),

  -- skupljanje (popodnevna smjena)
  pickup_condition text CHECK (pickup_condition IN ('ok', 'damage')),
  pickup_note text,
  pickup_photo_paths text[] NOT NULL DEFAULT '{}',
  picked_up_at timestamptz,
  picked_up_by uuid REFERENCES auth.users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_reports ENABLE ROW LEVEL SECURITY;

-- Čitanje: admin (pregled) + radnik (obje smjene trebaju handoff podatke)
CREATE POLICY "Admins and radnici can view booking reports" ON public.booking_reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

-- Pisanje: radnik puni s terena, admin može ispraviti.
-- ponytail: radnik smije UPDATE cijelog reda (i delivery i pickup polja) -- ok za par radnika;
-- ako ikad treba strože, splitaj u dvije politike s column checkovima
CREATE POLICY "Admins and radnici can insert booking reports" ON public.booking_reports
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

CREATE POLICY "Admins and radnici can update booking reports" ON public.booking_reports
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

-- Brisanje: samo admin (foto dokaz štete se ne briše s terena)
CREATE POLICY "Admins can delete booking reports" ON public.booking_reports
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- updated_at auto-refresh na svaki UPDATE (isti obrazac kao message_templates)
CREATE OR REPLACE FUNCTION public.set_booking_reports_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_reports_set_updated_at
  BEFORE UPDATE ON public.booking_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_reports_updated_at();


-- ---------------------------------------------------------------------------
-- Storage: PRIVATAN bucket za foto s terena (dokaz postavljanja + foto štete).
-- Privatan jer u kadru može biti tuđa kuća/dvorište -> čitanje preko signed URL-a
-- (supabase.storage.from('radnik-photos').createSignedUrl(path, 3600)).
INSERT INTO storage.buckets (id, name, public)
VALUES ('radnik-photos', 'radnik-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Radnici i admini upload radnik photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'radnik-photos'
    AND (public.has_role(auth.uid(), 'radnik') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Radnici i admini view radnik photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'radnik-photos'
    AND (public.has_role(auth.uid(), 'radnik') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admini delete radnik photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'radnik-photos'
    AND public.has_role(auth.uid(), 'admin')
  );
