-- Add add_table_set column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS add_table_set boolean DEFAULT false;

-- Remove booking_end_date column if it exists
ALTER TABLE public.bookings 
DROP COLUMN IF EXISTS booking_end_date;