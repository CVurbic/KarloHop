-- Trigger function to normalize bookings on insert:
-- 1. Map slug bounce house names to display names
-- 2. Set default price to 100 if not provided
-- 3. Set default status to 'confirmed' if still 'pending'
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
      ELSE
        -- leave as-is if already correct or unknown
        NULL;
    END CASE;
  END IF;

  -- Set default price to 100 if not provided
  IF NEW.price IS NULL THEN
    NEW.price := 100;
  END IF;

  -- Set status to confirmed for new bookings that come in as pending
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to bookings table (BEFORE INSERT so we can modify the row)
DROP TRIGGER IF EXISTS trg_normalize_booking ON bookings;
CREATE TRIGGER trg_normalize_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION normalize_booking();

-- Fix existing bookings with slug names
UPDATE bookings SET
  selected_bounce_house = CASE lower(selected_bounce_house)
    WHEN 'minecraft' THEN 'Minecraft Party'
    WHEN 'minecraft-party' THEN 'Minecraft Party'
    WHEN 'dino' THEN 'Dino Park'
    WHEN 'dino-park' THEN 'Dino Park'
    WHEN 'dinopark' THEN 'Dino Park'
    WHEN 'jednorog' THEN 'Jednorog'
    WHEN 'jednorog-svijet' THEN 'Jednorog'
    WHEN 'unicorn' THEN 'Jednorog'
    ELSE selected_bounce_house
  END
WHERE lower(selected_bounce_house) IN (
  'minecraft', 'minecraft-party',
  'dino', 'dino-park', 'dinopark',
  'jednorog', 'jednorog-svijet', 'unicorn'
);

-- Set price to 100 for existing bookings that have NULL price
UPDATE bookings SET price = 100 WHERE price IS NULL;

-- Set status to confirmed for existing pending bookings
UPDATE bookings SET status = 'confirmed' WHERE status = 'pending';
