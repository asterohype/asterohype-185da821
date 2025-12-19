-- Create table for product costs (CJDropshipping or other suppliers)
CREATE TABLE public.product_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  product_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

-- Admins can view all costs
CREATE POLICY "Admins can view all costs" 
ON public.product_costs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage costs
CREATE POLICY "Admins can manage costs" 
ON public.product_costs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_product_costs_updated_at
BEFORE UPDATE ON public.product_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();