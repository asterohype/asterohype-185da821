-- Local product overrides to enable editing without Shopify Admin API
CREATE TABLE IF NOT EXISTS public.product_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  title TEXT NULL,
  description TEXT NULL,
  price NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_overrides ENABLE ROW LEVEL SECURITY;

-- Public can read overrides (safe: only product display fields)
DO $$ BEGIN
  CREATE POLICY "Product overrides are viewable by everyone"
  ON public.product_overrides
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins can write overrides
DO $$ BEGIN
  CREATE POLICY "Admins can insert product overrides"
  ON public.product_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update product overrides"
  ON public.product_overrides
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete product overrides"
  ON public.product_overrides
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_product_overrides_updated_at ON public.product_overrides;
CREATE TRIGGER update_product_overrides_updated_at
BEFORE UPDATE ON public.product_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_product_overrides_shopify_product_id
ON public.product_overrides (shopify_product_id);