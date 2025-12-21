-- Add a toggle to enable/disable price overrides without deleting them
ALTER TABLE public.product_overrides
ADD COLUMN IF NOT EXISTS price_enabled boolean NOT NULL DEFAULT true;

-- Helpful index for admin listing
CREATE INDEX IF NOT EXISTS idx_product_overrides_price_enabled
ON public.product_overrides (price_enabled);
