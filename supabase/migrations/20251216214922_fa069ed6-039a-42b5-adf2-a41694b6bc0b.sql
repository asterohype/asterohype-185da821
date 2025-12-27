-- Update handle_new_user function with input validation
-- SECURITY DEFINER is required because this trigger runs before any user session exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _full_name text;
BEGIN
  -- Extract and validate full_name
  _full_name := trim(NEW.raw_user_meta_data ->> 'full_name');
  
  -- Validate full_name length (max 255 characters)
  IF _full_name IS NOT NULL AND length(_full_name) > 255 THEN
    _full_name := substring(_full_name from 1 for 255);
  END IF;
  
  -- Validate email format is present (Supabase should ensure this, but defense in depth)
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email is required for profile creation';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, _full_name);
  
  RETURN NEW;
END;
$$;