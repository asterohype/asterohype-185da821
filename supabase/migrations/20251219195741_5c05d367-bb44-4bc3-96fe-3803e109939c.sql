-- Create table to cache CJ Access Token
CREATE TABLE public.cj_token_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_token_cache ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access this table (edge functions use service role)
CREATE POLICY "Service role only" 
ON public.cj_token_cache 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Add trigger for updated_at
CREATE TRIGGER update_cj_token_cache_updated_at
BEFORE UPDATE ON public.cj_token_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();