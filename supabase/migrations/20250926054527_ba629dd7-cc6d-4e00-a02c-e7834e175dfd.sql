-- Create a proper bookings table with the right structure
-- First drop the existing table and recreate it properly
DROP TABLE IF EXISTS "HOP HOP REZERVACIJE";
DROP TABLE IF EXISTS bookings;

-- Create new bookings table with proper structure
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  delivery_address TEXT,
  booking_date DATE,
  selected_bounce_house TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow anyone to insert bookings
CREATE POLICY "Anyone can create bookings" 
ON bookings 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading all bookings (for admin purposes)
CREATE POLICY "Anyone can view bookings" 
ON bookings 
FOR SELECT 
USING (true);