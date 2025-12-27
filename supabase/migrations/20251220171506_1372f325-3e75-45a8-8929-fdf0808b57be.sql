-- Tabla para reseñas de productos
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar reseñas por producto
CREATE INDEX idx_product_reviews_product ON public.product_reviews(shopify_product_id);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden ver reseñas, usuarios autenticados pueden crear/editar las suyas
CREATE POLICY "Anyone can view product reviews" 
ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON public.product_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.product_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- Tabla para ofertas de productos (configurable por admin)
CREATE TABLE public.product_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL UNIQUE,
  -- Promo banner (ej: "Compra 2 y llévate envío gratis")
  promo_text TEXT,
  promo_subtext TEXT,
  promo_active BOOLEAN DEFAULT FALSE,
  -- Oferta con fecha límite
  offer_end_date TIMESTAMP WITH TIME ZONE,
  offer_text TEXT,
  offer_active BOOLEAN DEFAULT FALSE,
  -- Descuento
  discount_percent INTEGER,
  original_price NUMERIC(10,2),
  -- Urgencia de stock
  low_stock_threshold INTEGER,
  low_stock_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

-- Políticas: todos pueden ver ofertas, solo admins pueden modificar
CREATE POLICY "Anyone can view product offers" 
ON public.product_offers FOR SELECT USING (true);

CREATE POLICY "Admins can manage product offers" 
ON public.product_offers FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_offers_updated_at
BEFORE UPDATE ON public.product_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();