-- Block anonymous users from reading booking data
-- This ensures only authenticated admin users can view customer information
CREATE POLICY "Block anonymous read access" 
ON public.bookings 
FOR SELECT 
TO anon 
USING (false);