-- INSTRUCCIONES:
-- Copia y pega este contenido en el SQL Editor de tu proyecto en Supabase (https://supabase.com/dashboard/project/_/sql)
-- Esto asignará el rol de 'admin' a todos los usuarios registrados actualmente, solucionando el error de permisos.

-- Opción 1: Asignar rol de admin a TODOS los usuarios existentes (Recomendado para desarrollo local)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificación: Muestra los usuarios y sus roles
SELECT au.email, ur.role 
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id;

-- Opción 2 (Si la anterior falla o prefieres desactivar la seguridad temporalmente):
-- Descomenta las siguientes líneas para permitir que CUALQUIER usuario autenticado gestione etiquetas
/*
DROP POLICY IF EXISTS "Admins can manage tag assignments" ON public.product_tag_assignments;
CREATE POLICY "Authenticated users can manage tag assignments"
ON public.product_tag_assignments
FOR ALL
TO authenticated
USING (true);
*/
