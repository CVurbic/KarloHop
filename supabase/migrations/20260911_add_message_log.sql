-- Log korištenja predložaka poruka (message_templates).
--
-- Predlošci sami po sebi ne kažu koristi li ih itko i kada. Ova tablica je taj
-- dokaz: koji predložak, kome, kad, s kojim tekstom, i je li to bio pravi tap
-- radnika na terenu ili test iz dashboarda.
--
-- Status 'opened': SMS na terenu ide preko sms: deeplinka koji samo OTVORI SMS
-- aplikaciju s prefillanim tekstom -- ne znamo je li radnik stvarno stisnuo
-- "pošalji". Zato 'opened', ne 'sent'. 'test' = admin je kliknuo Pregledaj u
-- dashboardu. 'sent'/'failed' su rezervirani za buduće slanje sa servera.

CREATE TABLE IF NOT EXISTS public.message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,                  -- ne FK: predložak se smije obrisati, log ostaje
  channel text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'email')),
  recipient text,                              -- broj ili email; NULL kod testa bez primatelja
  body text NOT NULL,                          -- popunjeni tekst u trenutku slanja
  context jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { booking_ids, mode, ... }
  status text NOT NULL DEFAULT 'opened' CHECK (status IN ('opened', 'test', 'sent', 'failed')),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_log_template_key_idx
  ON public.message_log (template_key, created_at DESC);

ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

-- Pisanje: radnik (SMS s terena) + admin (test iz dashboarda).
CREATE POLICY "Admins and radnici can insert message log" ON public.message_log
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'radnik')
  );

-- Čitanje: samo admin (pregled u "Automatske poruke").
CREATE POLICY "Admins can view message log" ON public.message_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Bez UPDATE/DELETE politika: log je append-only.
-- ponytail: bez retention cron joba -- par poruka mjesečno, čisti se ručno ako ikad zatreba.
