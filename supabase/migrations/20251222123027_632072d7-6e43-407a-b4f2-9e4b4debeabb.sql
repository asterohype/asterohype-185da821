-- Create tester_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tester_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tester_codes ENABLE ROW LEVEL SECURITY;

-- Allow admin to manage tester codes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tester_codes' 
        AND policyname = 'Admins can manage tester codes'
    ) THEN
        CREATE POLICY "Admins can manage tester codes" 
        ON public.tester_codes 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END
$$;

-- Allow anyone to SELECT tester_codes for validation (only code/name visible, not full admin access)
CREATE POLICY "Anyone can validate tester codes" 
ON public.tester_codes 
FOR SELECT 
USING (is_active = true);