-- Run this ONCE in Supabase Dashboard → SQL Editor
-- Fixes: "Database error saving new user" on signup

-- 1. Recreate trigger function with correct security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 2. Ensure auth admin can access public schema (belt-and-suspenders)
GRANT USAGE ON SCHEMA public TO postgres, supabase_auth_admin;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO postgres, supabase_auth_admin;

-- 3. Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
