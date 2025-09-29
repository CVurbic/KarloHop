-- Remove the booking_end_date column from bookings table
ALTER TABLE public.bookings DROP COLUMN IF EXISTS booking_end_date;

-- Add a multiple_days checkbox column
ALTER TABLE public.bookings ADD COLUMN multiple_days boolean DEFAULT false;