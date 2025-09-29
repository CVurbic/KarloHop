-- Remove authentication requirements from RLS policies
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

-- Create new policies that allow public access
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Bookings remain private for viewing (admin only)
CREATE POLICY "No one can view bookings" 
ON public.bookings 
FOR SELECT 
USING (false);