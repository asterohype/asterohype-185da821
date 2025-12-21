-- Add title_separator to product_overrides for splitting title into title/subtitle
ALTER TABLE public.product_overrides 
ADD COLUMN IF NOT EXISTS title_separator text DEFAULT NULL;

-- Add index for lookup
CREATE INDEX IF NOT EXISTS idx_product_overrides_title_separator ON public.product_overrides(title_separator) WHERE title_separator IS NOT NULL;