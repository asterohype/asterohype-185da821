-- Create table for product option name aliases
CREATE TABLE public.product_option_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shopify_product_id, original_name)
);

-- Enable RLS
ALTER TABLE public.product_option_aliases ENABLE ROW LEVEL SECURITY;

-- Admins can manage option aliases
CREATE POLICY "Admins can manage option aliases" 
ON public.product_option_aliases 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view option aliases (for frontend display)
CREATE POLICY "Anyone can view option aliases" 
ON public.product_option_aliases 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_product_option_aliases_updated_at
BEFORE UPDATE ON public.product_option_aliases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();