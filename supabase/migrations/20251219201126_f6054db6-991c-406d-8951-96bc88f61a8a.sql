-- Add cj_product_id column to product_costs table
ALTER TABLE public.product_costs 
ADD COLUMN cj_product_id TEXT;

-- Add index for faster lookups
CREATE INDEX idx_product_costs_cj_product_id ON public.product_costs(cj_product_id);