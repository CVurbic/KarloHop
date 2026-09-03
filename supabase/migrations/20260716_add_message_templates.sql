-- Predlošci automatskih poruka (SMS i sl.), uređivi iz admin dashboarda
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  body text NOT NULL,
  placeholders text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Postojeća ETA SMS poruka (radnik -> klijent), prebačena iz hardkodiranog stringa u TripCard.tsx
INSERT INTO message_templates (key, label, body, placeholders) VALUES
  ('eta_sms', 'SMS - dolazak za X minuta', 'Pozdrav, za {min} min smo kod Vas s Vašim {stavke}. Vaš HopHopNapuhanci tim.', ARRAY['min', 'stavke']),
  ('eta_sms_fallback', 'SMS - krećemo (kad procjena vremena nije dostupna)', 'Pozdrav, krećemo prema Vama s Vašim {stavke}. Vaš HopHopNapuhanci tim.', ARRAY['stavke'])
ON CONFLICT (key) DO NOTHING;

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Čitanje: admin (uređuje) i radnik (šalje SMS na terenu) trebaju vidjeti predloške
CREATE POLICY "Admins and radnici can view message templates" ON message_templates
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

-- Pisanje: samo admin
CREATE POLICY "Admins can insert message templates" ON message_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update message templates" ON message_templates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete message templates" ON message_templates
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- updated_at auto-refresh na svaki UPDATE
CREATE OR REPLACE FUNCTION public.set_message_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_templates_set_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_message_templates_updated_at();
