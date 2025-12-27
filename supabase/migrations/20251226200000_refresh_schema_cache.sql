-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Add comments to tables to ensure schema change detection
COMMENT ON TABLE public.edit_status_fields IS 'Table for storing edit status fields definition';
COMMENT ON TABLE public.product_custom_status IS 'Table for storing custom status per product';

-- Ensure permissions are explicitly granted
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.edit_status_fields TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_custom_status TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_edit_status TO anon, authenticated, service_role;

-- Grant permissions on future tables automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
