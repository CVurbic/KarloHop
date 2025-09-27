-- Fix the security warning by setting the search_path
DROP FUNCTION IF EXISTS check_bounce_house_availability(text, date, date);

CREATE OR REPLACE FUNCTION check_bounce_house_availability(
  bounce_house_name text,
  check_start_date date,
  check_end_date date
)
RETURNS TABLE (
  unavailable_date date,
  booking_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Find all dates where the bounce house is already booked
  SELECT DISTINCT
    generate_series(
      GREATEST(b.booking_start_date, check_start_date),
      LEAST(b.booking_end_date, check_end_date),
      '1 day'::interval
    )::date as unavailable_date,
    b.id as booking_id
  FROM bookings b
  WHERE b.selected_bounce_house = bounce_house_name
    AND b.booking_start_date <= check_end_date
    AND b.booking_end_date >= check_start_date
  ORDER BY unavailable_date;
$$;