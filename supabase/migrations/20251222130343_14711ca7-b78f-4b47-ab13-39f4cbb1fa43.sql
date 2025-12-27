-- Create product_test_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_test_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id TEXT NOT NULL,
  tester_code TEXT NOT NULL,
  rating TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_test_ratings ENABLE ROW LEVEL SECURITY;

-- Add unique constraint for upsert to work on product_test_ratings
CREATE UNIQUE INDEX IF NOT EXISTS product_test_ratings_product_tester_unique 
ON public.product_test_ratings (shopify_product_id, tester_code);