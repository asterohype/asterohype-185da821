-- Añadir columna group_name a product_tags
ALTER TABLE public.product_tags ADD COLUMN group_name text NOT NULL DEFAULT 'General';

-- Actualizar las etiquetas existentes al grupo General
UPDATE public.product_tags SET group_name = 'General';

-- Insertar etiquetas del grupo "Ropa Detallado"
INSERT INTO public.product_tags (name, slug, group_name) VALUES
  ('Vaqueros', 'vaqueros', 'Ropa Detallado'),
  ('Chaquetas', 'chaquetas', 'Ropa Detallado'),
  ('Chandal', 'chandal', 'Ropa Detallado'),
  ('Unisex', 'unisex', 'Ropa Detallado'),
  ('Camisetas', 'camisetas', 'Ropa Detallado'),
  ('Pantalones', 'pantalones', 'Ropa Detallado'),
  ('Sudaderas', 'sudaderas', 'Ropa Detallado'),
  ('Vestidos', 'vestidos', 'Ropa Detallado'),
  ('Faldas', 'faldas', 'Ropa Detallado');

-- Insertar etiquetas del grupo "Estilos/Conjuntos"
INSERT INTO public.product_tags (name, slug, group_name) VALUES
  ('Trajes', 'trajes', 'Estilos'),
  ('Chalecos', 'chalecos', 'Estilos'),
  ('Camisas', 'camisas', 'Estilos'),
  ('Formal', 'formal', 'Estilos'),
  ('Casual', 'casual', 'Estilos'),
  ('Deportivo', 'deportivo-estilo', 'Estilos'),
  ('Elegante', 'elegante', 'Estilos'),
  ('Urbano', 'urbano', 'Estilos');

-- Insertar etiquetas del grupo "Destacados"
INSERT INTO public.product_tags (name, slug, group_name) VALUES
  ('Top', 'top', 'Destacados'),
  ('Trending', 'trending', 'Destacados'),
  ('Ofertas', 'ofertas', 'Destacados'),
  ('Nuevos', 'nuevos', 'Destacados'),
  ('Destacado', 'destacado', 'Destacados');