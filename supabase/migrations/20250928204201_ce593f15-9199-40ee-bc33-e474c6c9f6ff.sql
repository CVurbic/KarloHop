-- Remove the public read policy that exposes customer PII
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;

-- Create a secure policy that only allows authenticated users to view their own bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND false); -- Temporarily block all reads until auth is implemented

-- Update the INSERT policy to require authentication
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create a security definer function for availability checking that doesn't expose PII
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
  -- Only return unavailable dates without exposing any customer information
  SELECT DISTINCT
    generate_series(
      GREATEST(b.booking_start_date, check_start_date),
      LEAST(b.booking_end_date, check_end_date),
      '1 day'::interval
    )::date as unavailable_date
  FROM bookings b
  WHERE b.selected_bounce_house = bounce_house_name
    AND b.booking_start_date <= check_end_date
    AND b.booking_end_date >= check_start_date
  ORDER BY unavailable_date;
$$;