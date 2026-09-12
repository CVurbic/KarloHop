-- Teya linkovi za naplatu karticom na vratima, po fiksnoj cijeni (npr. 100€, 140€) -- uređivo iz admin dashboarda
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric NOT NULL UNIQUE,
  url text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Čitanje: admin (uređuje) i radnik (naplaćuje na terenu) trebaju vidjeti linkove
CREATE POLICY "Admins and radnici can view payment links" ON payment_links
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

-- Pisanje: samo admin
CREATE POLICY "Admins can insert payment links" ON payment_links
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment links" ON payment_links
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment links" ON payment_links
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- updated_at auto-refresh na svaki UPDATE
CREATE OR REPLACE FUNCTION public.set_payment_links_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_links_set_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_links_updated_at();
