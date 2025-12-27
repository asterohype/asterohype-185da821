-- Fix permissions for site_categories table
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.site_categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.site_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.site_categories;

-- Enable RLS
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;

-- Re-create policies with broader access for read
CREATE POLICY "Enable read access for all users"
ON public.site_categories FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.site_categories FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only"
ON public.site_categories FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only"
ON public.site_categories FOR DELETE
USING (auth.role() = 'authenticated');

-- Explicitly grant permissions to roles
GRANT SELECT ON public.site_categories TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_categories TO authenticated, service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
