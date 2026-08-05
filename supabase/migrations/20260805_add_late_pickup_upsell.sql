-- Late night pickup upsell ("kasno noćno preuzimanje").
-- When a customer opts in, the party is extended and the inflatable is not
-- picked up before 22:00. This costs an extra +30€ on top of the base price.
--
-- 1) Store the opt-in on the booking.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS late_pickup boolean DEFAULT false;

-- 2) Teach the booking normaliser to add +30€ when late pickup is selected.
--    The surcharge is only applied when no explicit price was provided (i.e. the
--    public booking flow, where the trigger derives the price). Admin bookings
--    set the price by hand, so their value is always respected as-is — the same
--    behaviour that already applies to the other add-ons.
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
      WHEN 'nogomet', 'nogomet-napuhanac', 'nogometni izazov', 'nogometni-izazov', 'football' THEN
        NEW.selected_bounce_house := 'Nogometni izazov';
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

    -- Late night pickup upsell: +30€
    IF COALESCE(NEW.late_pickup, false) THEN
      NEW.price := NEW.price + 30;
    END IF;
  END IF;

  -- Set status to confirmed for new bookings that come in as pending
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Accept the opt-in through the public booking RPC so anonymous callers can
--    set it. Keeps the existing add-on parameters intact.
--    Adding a parameter changes the function signature, so the previous 10-arg
--    overload is dropped first to avoid an ambiguous-function error at call time.
DROP FUNCTION IF EXISTS public.create_public_booking(
  text, text, text, text, text, date, text, text, boolean, boolean
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
  p_late_pickup boolean DEFAULT false
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
    add_table_set, multiple_days, late_pickup
  ) VALUES (
    p_name, p_surname, p_email, p_phone, p_delivery_address,
    p_booking_start_date, p_selected_bounce_house, p_additional_notes,
    p_add_table_set, p_multiple_days, p_late_pickup
  )
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END;
$$;
