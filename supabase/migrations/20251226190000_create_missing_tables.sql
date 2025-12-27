-- Create edit_status_fields table
CREATE TABLE IF NOT EXISTS public.edit_status_fields (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edit_status_fields ENABLE ROW LEVEL SECURITY;

-- Policies (Drop first to avoid duplicates)
DROP POLICY IF EXISTS "Allow public read access to edit_status_fields" ON public.edit_status_fields;
CREATE POLICY "Allow public read access to edit_status_fields"
  ON public.edit_status_fields FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin write access to edit_status_fields" ON public.edit_status_fields;
CREATE POLICY "Allow admin write access to edit_status_fields"
  ON public.edit_status_fields FOR ALL
  USING (auth.role() = 'authenticated'); -- Simplified for now, ideally check for admin role

-- Insert default fields
INSERT INTO public.edit_status_fields (key, label, is_active, is_custom)
VALUES 
  ('title_done', 'Título', true, false),
  ('price_done', 'Precio', true, false),
  ('about_done', 'Acerca de', true, false),
  ('description_done', 'Descripción', true, false),
  ('model_done', 'Modelo', true, false),
  ('color_done', 'Color', true, false),
  ('tags_done', 'Etiquetas', true, false),
  ('offers_done', 'Ofertas', true, false),
  ('images_done', 'Imágenes', true, false)
ON CONFLICT (key) DO NOTHING;

-- Create product_custom_status table
CREATE TABLE IF NOT EXISTS public.product_custom_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  field_key TEXT NOT NULL REFERENCES public.edit_status_fields(key),
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shopify_product_id, field_key)
);

-- Enable RLS
ALTER TABLE public.product_custom_status ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access to product_custom_status" ON public.product_custom_status;
CREATE POLICY "Allow public read access to product_custom_status"
  ON public.product_custom_status FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin write access to product_custom_status" ON public.product_custom_status;
CREATE POLICY "Allow admin write access to product_custom_status"
  ON public.product_custom_status FOR ALL
  USING (auth.role() = 'authenticated');

-- Create product_edit_status table (Standard fields)
CREATE TABLE IF NOT EXISTS public.product_edit_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  title_done BOOLEAN DEFAULT false,
  price_done BOOLEAN DEFAULT false,
  description_done BOOLEAN DEFAULT false,
  about_done BOOLEAN DEFAULT false,
  model_done BOOLEAN DEFAULT false,
  color_done BOOLEAN DEFAULT false,
  tags_done BOOLEAN DEFAULT false,
  offers_done BOOLEAN DEFAULT false,
  images_done BOOLEAN DEFAULT false,
  all_done BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_edit_status ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access to product_edit_status" ON public.product_edit_status;
CREATE POLICY "Allow public read access to product_edit_status"
  ON public.product_edit_status FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin write access to product_edit_status" ON public.product_edit_status;
CREATE POLICY "Allow admin write access to product_edit_status"
  ON public.product_edit_status FOR ALL
  USING (auth.role() = 'authenticated');
