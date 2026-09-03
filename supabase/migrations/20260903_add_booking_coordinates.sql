-- Koordinate dostave, hvatane vec client-side u BookingSection.tsx (Google Places
-- Autocomplete / rucni pin) ali dosad nigdje spremane -> radnik ih je morao
-- geokodirati iznova pri svakom otvaranju rute. Ovo ih konacno provodi do baze.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- p_lat/p_lng change the signature, and this DB also carries an older
-- p_late_pickup overload used by main's live late-pickup upsell (not present
-- on this branch). Rather than dropping either, unify both into one function
-- so there is exactly one create_public_booking and callers from either
-- branch keep working (each param defaults, so omitting it is harmless).
DROP FUNCTION IF EXISTS public.create_public_booking(
  text, text, text, text, text, date, text, text, boolean, boolean, boolean
);
DROP FUNCTION IF EXISTS public.create_public_booking(
  text, text, text, text, text, date, text, text, boolean, boolean, double precision, double precision
);

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_name text,
  p_surname text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_booking_start_date date DEFAULT NULL,
  p_selected_bounce_house text DEFAULT NULL,
  p_additional_notes text DEFAULT NULL,
  p_add_table_set boolean DEFAULT false,
  p_multiple_days boolean DEFAULT false,
  p_late_pickup boolean DEFAULT false,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL
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
    add_table_set, multiple_days, late_pickup, lat, lng
  ) VALUES (
    p_name, p_surname, p_email, p_phone, p_delivery_address,
    p_booking_start_date, p_selected_bounce_house, p_additional_notes,
    p_add_table_set, p_multiple_days, p_late_pickup, p_lat, p_lng
  )
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END;
$$;
