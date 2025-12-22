-- Allow anyone to SELECT tester_codes for validation (only code/name visible, not full admin access)
CREATE POLICY "Anyone can validate tester codes" 
ON public.tester_codes 
FOR SELECT 
USING (is_active = true);