-- Add subtitle field to product_overrides table
ALTER TABLE public.product_overrides 
ADD COLUMN IF NOT EXISTS subtitle TEXT;