-- Create a SECURITY DEFINER function for public booking creation.
-- This bypasses RLS SELECT restrictions so the inserted row (including id)
-- can be returned to the caller, fixing the issue where anonymous users
-- see an error despite the booking being created successfully.
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
  p_multiple_days boolean DEFAULT false
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
    add_table_set, multiple_days
  ) VALUES (
    p_name, p_surname, p_email, p_phone, p_delivery_address,
    p_booking_start_date, p_selected_bounce_house, p_additional_notes,
    p_add_table_set, p_multiple_days
  )
  RETURNING * INTO v_booking;

  RETURN row_to_json(v_booking);
END;
$$;
