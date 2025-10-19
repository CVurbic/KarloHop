-- Update check_availability_safe function to work with single-day bookings
-- Remove references to booking_end_date which no longer exists
CREATE OR REPLACE FUNCTION public.check_availability_safe(
  bounce_house_name text,
  check_start_date date,
  check_end_date date
)
RETURNS TABLE(unavailable_date date)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Return dates where the bounce house is already booked
  SELECT DISTINCT b.booking_start_date as unavailable_date
  FROM bookings b
  WHERE b.selected_bounce_house = bounce_house_name
    AND b.booking_start_date >= check_start_date
    AND b.booking_start_date <= check_end_date
  ORDER BY unavailable_date;
$$;