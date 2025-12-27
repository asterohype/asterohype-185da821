-- Create table for tracking product edit status
-- Each field has its own completion status
CREATE TABLE IF NOT EXISTS public.product_edit_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  title_done BOOLEAN NOT NULL DEFAULT false,
  price_done BOOLEAN NOT NULL DEFAULT false,
  description_done BOOLEAN NOT NULL DEFAULT false,
  about_done BOOLEAN NOT NULL DEFAULT false,
  model_done BOOLEAN NOT NULL DEFAULT false,
  color_done BOOLEAN NOT NULL DEFAULT false,
  tags_done BOOLEAN NOT NULL DEFAULT false,
  offers_done BOOLEAN NOT NULL DEFAULT false,
  images_done BOOLEAN NOT NULL DEFAULT false,
  all_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_edit_status ENABLE ROW LEVEL SECURITY;

-- Policies for admin access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_edit_status' 
        AND policyname = 'Admins can manage product edit status'
    ) THEN
        CREATE POLICY "Admins can manage product edit status" 
        ON public.product_edit_status 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_edit_status' 
        AND policyname = 'Anyone can view product edit status'
    ) THEN
        CREATE POLICY "Anyone can view product edit status" 
        ON public.product_edit_status 
        FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Create trigger for automatic all_done update
CREATE OR REPLACE FUNCTION public.update_all_done_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.all_done = NEW.title_done AND NEW.price_done AND NEW.description_done AND 
                  NEW.about_done AND NEW.model_done AND NEW.color_done AND 
                  NEW.tags_done AND NEW.offers_done AND NEW.images_done;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_product_edit_status_all_done ON public.product_edit_status;
CREATE TRIGGER update_product_edit_status_all_done
BEFORE INSERT OR UPDATE ON public.product_edit_status
FOR EACH ROW
EXECUTE FUNCTION public.update_all_done_status();