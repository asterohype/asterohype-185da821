-- Drop the SECURITY DEFINER view and recreate it as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.user_admin_request_status;

-- Recreate the view with explicit SECURITY INVOKER
CREATE VIEW public.user_admin_request_status 
WITH (security_invoker = true) AS
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