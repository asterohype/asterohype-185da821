-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create test ratings" ON public.product_test_ratings;
DROP POLICY IF EXISTS "Anyone can delete test ratings" ON public.product_test_ratings;
DROP POLICY IF EXISTS "Anyone can update their test ratings" ON public.product_test_ratings;

-- Create security definer function to validate tester codes
CREATE OR REPLACE FUNCTION public.is_valid_tester_code(_tester_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tester_codes
    WHERE code = _tester_code
      AND is_active = true
  )
$$;

-- New policy: Only valid tester codes can insert ratings
CREATE POLICY "Valid testers can create ratings"
ON public.product_test_ratings
FOR INSERT
WITH CHECK (
  is_valid_tester_code(tester_code)
);

-- New policy: Valid testers can update their own ratings OR admins can update any
CREATE POLICY "Testers can update their ratings"
ON public.product_test_ratings
FOR UPDATE
USING (
  is_valid_tester_code(tester_code) OR has_role(auth.uid(), 'admin')
);

-- New policy: Valid testers can delete their own ratings OR admins can delete any
CREATE POLICY "Testers can delete their ratings"
ON public.product_test_ratings
FOR DELETE
USING (
  is_valid_tester_code(tester_code) OR has_role(auth.uid(), 'admin')
);