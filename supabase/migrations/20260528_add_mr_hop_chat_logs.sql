-- Mr. Hop conversation logging + daily e-mail digest.
--
--   1. mr_hop_chat_logs: one row per conversation (upserted by the edge
--      function on every turn, keyed by conversation_id), readable by admins
--      in the panel.
--   2. A self-contained shared secret (generated in-DB, never committed) used
--      to authorise the scheduled digest call.
--   3. A daily pg_cron job that invokes the send-chat-digest edge function.

-- ---------------------------------------------------------------------------
-- 1. Conversation log table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mr_hop_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL UNIQUE,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count int NOT NULL DEFAULT 0,
  booking jsonb,
  booking_created boolean NOT NULL DEFAULT false,
  is_test boolean NOT NULL DEFAULT false,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mr_hop_chat_logs_updated_at_idx
  ON public.mr_hop_chat_logs (updated_at DESC);

ALTER TABLE public.mr_hop_chat_logs ENABLE ROW LEVEL SECURITY;

-- Admins read logs in the panel. Writes happen only via the edge function
-- (service role), which bypasses RLS, so no write policy is needed.
DROP POLICY IF EXISTS "Admins can view chat logs" ON public.mr_hop_chat_logs;
CREATE POLICY "Admins can view chat logs" ON public.mr_hop_chat_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 2. Internal shared secret for the scheduled digest call
--    (generated in-DB so it never lands in git or logs).
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);

INSERT INTO private.app_secrets (name)
VALUES ('chat_digest')
ON CONFLICT (name) DO NOTHING;

-- The edge function (service role) calls this to authorise itself. Returns
-- true only when the presented secret matches the stored one.
CREATE OR REPLACE FUNCTION public.mr_hop_verify_digest_secret(p_secret text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1 FROM private.app_secrets
    WHERE name = 'chat_digest' AND secret = p_secret
  );
$$;

REVOKE ALL ON FUNCTION public.mr_hop_verify_digest_secret(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mr_hop_verify_digest_secret(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Daily digest schedule (pg_cron -> pg_net -> edge function)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace any previous version of the job so re-running the migration is safe.
SELECT cron.unschedule('mr-hop-daily-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mr-hop-daily-digest');

-- 18:00 UTC ~= 20:00 Zagreb (CEST). The function covers a rolling 24h window,
-- so the exact minute is not critical.
SELECT cron.schedule(
  'mr-hop-daily-digest',
  '0 18 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://egwtrsfcobwybcnbqsok.supabase.co/functions/v1/send-chat-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-digest-secret', (SELECT secret FROM private.app_secrets WHERE name = 'chat_digest')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
