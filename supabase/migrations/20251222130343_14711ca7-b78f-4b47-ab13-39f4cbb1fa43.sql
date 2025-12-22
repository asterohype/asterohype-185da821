-- Add unique constraint for upsert to work on product_test_ratings
CREATE UNIQUE INDEX IF NOT EXISTS product_test_ratings_product_tester_unique 
ON public.product_test_ratings (shopify_product_id, tester_code);