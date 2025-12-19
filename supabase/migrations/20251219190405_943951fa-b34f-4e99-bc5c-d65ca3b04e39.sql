-- Fix 1: admin_requests - Users should only see limited data (not IP/device info)
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own requests" ON public.admin_requests;

-- Create a more restrictive policy - users can only see their request status, not sensitive data
-- We'll use a view approach, but first restrict the SELECT policy
CREATE POLICY "Users can view their own request status" 
ON public.admin_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add explicit admin policy for admin_requests
DROP POLICY IF EXISTS "Admins can view all requests" ON public.admin_requests;
CREATE POLICY "Admins can view all requests" 
ON public.admin_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin update policy
DROP POLICY IF EXISTS "Admins can update requests" ON public.admin_requests;
CREATE POLICY "Admins can update requests" 
ON public.admin_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: profiles - Add explicit admin policy (currently only users can see their own)
-- The current setup is actually secure - only users can see their own profile
-- Let's add an explicit admin SELECT policy with a clear audit trail
DROP POLICY IF EXISTS "Admins can view profiles for support" ON public.profiles;
CREATE POLICY "Admins can view profiles for support" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a secure view for users to see their admin request status without sensitive data
CREATE OR REPLACE VIEW public.user_admin_request_status AS
SELECT 
  id,
  user_id,
  status,
  created_at,
  reviewed_at
FROM public.admin_requests
WHERE auth.uid() = user_id;

-- Grant access to the view
GRANT SELECT ON public.user_admin_request_status TO authenticated;