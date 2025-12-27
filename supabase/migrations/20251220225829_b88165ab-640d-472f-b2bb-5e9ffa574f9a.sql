-- Create table for storing Asian to local size conversions
CREATE TABLE public.product_size_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  asian_size TEXT NOT NULL,
  local_size TEXT NOT NULL,
  size_type TEXT NOT NULL DEFAULT 'clothing', -- clothing, shoes, accessories
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shopify_product_id, asian_size)
);

-- Enable RLS
ALTER TABLE public.product_size_conversions ENABLE ROW LEVEL SECURITY;

-- Admins can manage size conversions
CREATE POLICY "Admins can manage size conversions"
ON public.product_size_conversions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view size conversions (for product display)
CREATE POLICY "Anyone can view size conversions"
ON public.product_size_conversions
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_product_size_conversions_updated_at
BEFORE UPDATE ON public.product_size_conversions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();