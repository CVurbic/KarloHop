-- Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_ip text NOT NULL,
  endpoint text NOT NULL,
  request_count int DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(client_ip, endpoint)
);

-- Enable RLS on rate limits table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.api_rate_limits(client_ip, endpoint);

-- Create rate limit checking function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_client_ip text,
  p_endpoint text,
  p_max_requests int DEFAULT 5,
  p_window_minutes int DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_window_start timestamptz;
BEGIN
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM api_rate_limits
  WHERE client_ip = p_client_ip AND endpoint = p_endpoint;
  
  IF NOT FOUND THEN
    INSERT INTO api_rate_limits (client_ip, endpoint)
    VALUES (p_client_ip, p_endpoint);
    RETURN true;
  END IF;
  
  IF v_window_start < now() - (p_window_minutes || ' minutes')::interval THEN
    UPDATE api_rate_limits
    SET request_count = 1, window_start = now()
    WHERE client_ip = p_client_ip AND endpoint = p_endpoint;
    RETURN true;
  END IF;
  
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  UPDATE api_rate_limits
  SET request_count = request_count + 1
  WHERE client_ip = p_client_ip AND endpoint = p_endpoint;
  RETURN true;
END;
$$;

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function to check user roles (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can see their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Drop the old restrictive SELECT policy on bookings
DROP POLICY IF EXISTS "No one can view bookings" ON public.bookings;

-- Create new policy allowing admins to view bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create policy allowing admins to update bookings
CREATE POLICY "Admins can update bookings" ON public.bookings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create policy allowing admins to delete bookings
CREATE POLICY "Admins can delete bookings" ON public.bookings
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));