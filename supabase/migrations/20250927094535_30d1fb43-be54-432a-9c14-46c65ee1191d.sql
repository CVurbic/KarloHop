-- Update bookings table to support multiple days
ALTER TABLE public.bookings 
DROP COLUMN booking_date;

-- Add new columns for date range booking
ALTER TABLE public.bookings 
ADD COLUMN booking_start_date date NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN booking_end_date date NOT NULL DEFAULT CURRENT_DATE;

-- Add constraint to ensure end date is not before start date
ALTER TABLE public.bookings
ADD CONSTRAINT check_date_range CHECK (booking_end_date >= booking_start_date);

-- Create index for faster availability queries
CREATE INDEX idx_bookings_availability ON public.bookings (selected_bounce_house, booking_start_date, booking_end_date);

-- Add function to check availability for a bounce house in a date range
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