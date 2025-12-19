-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create product_tags table
CREATE TABLE public.product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Anyone can view tags"
ON public.product_tags
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags"
ON public.product_tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create product_tag_assignments table (links Shopify product IDs to tags)
CREATE TABLE public.product_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id TEXT NOT NULL,
    tag_id UUID REFERENCES public.product_tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (shopify_product_id, tag_id)
);

-- Enable RLS on product_tag_assignments
ALTER TABLE public.product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can view assignments
CREATE POLICY "Anyone can view tag assignments"
ON public.product_tag_assignments
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can manage assignments
CREATE POLICY "Admins can manage tag assignments"
ON public.product_tag_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default tags
INSERT INTO public.product_tags (name, slug) VALUES
    ('Hombre', 'hombre'),
    ('Mujer', 'mujer'),
    ('Ropa', 'ropa'),
    ('Hogar', 'hogar'),
    ('Decoración', 'decoracion'),
    ('Zapatos', 'zapatos'),
    ('Tecnología', 'tecnologia'),
    ('Accesorios', 'accesorios'),
    ('Electrónica', 'electronica'),
    ('Gadgets', 'gadgets'),
    ('Fundas', 'fundas'),
    ('Calzado', 'calzado'),
    ('Cocina', 'cocina'),
    ('Belleza', 'belleza'),
    ('Deporte', 'deporte');