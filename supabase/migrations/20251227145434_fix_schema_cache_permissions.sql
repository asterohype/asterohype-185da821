-- Explicitly grant permissions to anon and authenticated roles
GRANT SELECT ON public.site_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_categories TO authenticated;
GRANT ALL ON public.site_categories TO service_role;

-- Add a comment to the table to force a schema change event
COMMENT ON TABLE public.site_categories IS 'Categories for the website navigation and filtering';

-- Notify pgrst again to reload schema cache
NOTIFY pgrst, 'reload schema';
