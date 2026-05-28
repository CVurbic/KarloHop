-- Mr. Hop chatbot support:
--   1. Track booking source (form vs chatbot) so chatbot bookings can be
--      treated differently (kept as 'pending' for manual phone confirmation).
--   2. Dedicated RPC for chatbot bookings.
--   3. Server-side rate limiting (per IP) to prevent abuse of the chat endpoint.

-- ---------------------------------------------------------------------------
-- 1. Booking source column
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'form';

-- Keep chatbot bookings as 'pending' (the team confirms them by phone),
-- while form bookings keep their existing auto-confirm behaviour.
-- Based on the latest normalize_booking (see 20260509_add_super_mario_product.sql):
-- preserves Super Mario name mapping and per-bouncer price defaults.
CREATE OR REPLACE FUNCTION normalize_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize bounce house name from slug to display name
  IF NEW.selected_bounce_house IS NOT NULL THEN
    CASE lower(NEW.selected_bounce_house)
      WHEN 'minecraft', 'minecraft-party', 'minecraft party' THEN
        NEW.selected_bounce_house := 'Minecraft Party';
      WHEN 'dino', 'dino-park', 'dino park', 'dinopark' THEN
        NEW.selected_bounce_house := 'Dino Park';
      WHEN 'jednorog', 'jednorog-svijet', 'jednorog svijet', 'unicorn' THEN
        NEW.selected_bounce_house := 'Jednorog';
      WHEN 'super mario', 'super-mario', 'mario', 'super mario tobogan', 'super-mario-tobogan' THEN
        NEW.selected_bounce_house := 'Super Mario';
      ELSE
        -- leave as-is if already correct or unknown
        NULL;
    END CASE;
  END IF;

  -- Set default price based on bouncer when not provided
  IF NEW.price IS NULL THEN
    IF NEW.selected_bounce_house = 'Super Mario' THEN
      NEW.price := 150;
    ELSE
      NEW.price := 100;
    END IF;
  END IF;

  -- Form bookings auto-confirm; chatbot bookings stay 'pending' for review.
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' AND NEW.source = 'form' THEN
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Chatbot booking RPC (SECURITY DEFINER so the edge function can insert
--    and read back the created row regardless of RLS).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_chatbot_booking(
  p_name text,
  p_surname text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_booking_start_date date DEFAULT NULL,
  p_selected_bounce_house text DEFAULT NULL,
  p_additional_notes text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_is_test boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings;
BEGIN
  INSERT INTO bookings (
    name, surname, email, phone, delivery_address,
    booking_start_date, selected_bounce_house, additional_notes,
    price, status, source
  ) VALUES (
    p_name, p_surname, p_email, p_phone, p_delivery_address,
    p_booking_start_date, p_selected_bounce_house, p_additional_notes,
    p_price, 'pending',
    CASE WHEN p_is_test THEN 'chatbot-test' ELSE 'chatbot' END
  )
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Rate limiting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mr_hop_rate_limits (
  ip text PRIMARY KEY,
  minute_window timestamptz NOT NULL DEFAULT now(),
  minute_count int NOT NULL DEFAULT 0,
  day_window date NOT NULL DEFAULT current_date,
  day_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Locked down: only the SECURITY DEFINER function (or service role) touches it.
ALTER TABLE public.mr_hop_rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomically increments the per-IP counters and reports whether the request
-- is within the allowed limits. Returns the live counters for logging.
CREATE OR REPLACE FUNCTION public.mr_hop_rate_limit(
  p_ip text,
  p_max_per_minute int DEFAULT 10,
  p_max_per_day int DEFAULT 80
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row mr_hop_rate_limits;
BEGIN
  INSERT INTO mr_hop_rate_limits (ip)
  VALUES (p_ip)
  ON CONFLICT (ip) DO NOTHING;

  SELECT * INTO v_row FROM mr_hop_rate_limits WHERE ip = p_ip FOR UPDATE;

  IF v_row.minute_window < now() - interval '1 minute' THEN
    v_row.minute_count := 0;
    v_row.minute_window := now();
  END IF;

  IF v_row.day_window <> current_date THEN
    v_row.day_count := 0;
    v_row.day_window := current_date;
  END IF;

  v_row.minute_count := v_row.minute_count + 1;
  v_row.day_count := v_row.day_count + 1;

  UPDATE mr_hop_rate_limits
  SET minute_window = v_row.minute_window,
      minute_count = v_row.minute_count,
      day_window = v_row.day_window,
      day_count = v_row.day_count,
      updated_at = now()
  WHERE ip = p_ip;

  RETURN json_build_object(
    'allowed', (v_row.minute_count <= p_max_per_minute) AND (v_row.day_count <= p_max_per_day),
    'minute_count', v_row.minute_count,
    'day_count', v_row.day_count
  );
END;
$$;
