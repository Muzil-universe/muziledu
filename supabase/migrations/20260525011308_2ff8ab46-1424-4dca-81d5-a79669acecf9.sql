
-- Fix 1: Restrict profile updates to non-privileged columns only
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.institution_id IS DISTINCT FROM OLD.institution_id
     OR NEW.institution_name IS DISTINCT FROM OLD.institution_name
     OR NEW.inst_type IS DISTINCT FROM OLD.inst_type
     OR NEW.teacher_code IS DISTINCT FROM OLD.teacher_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.email IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Cannot modify privileged profile fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privileged_profile_changes_trg ON public.profiles;
CREATE TRIGGER prevent_privileged_profile_changes_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_profile_changes();

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add explicit INSERT policy on profiles (only allow inserting own row)
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Restrict institutions reads — hide email/admin_user_id from general auth users
DROP POLICY IF EXISTS "Anyone authenticated reads institutions" ON public.institutions;

-- Create a safe view exposing only non-sensitive columns
CREATE OR REPLACE VIEW public.institutions_public AS
SELECT id, name, city, type, created_at FROM public.institutions;

GRANT SELECT ON public.institutions_public TO authenticated, anon;

-- Only the admin of an institution can read full row (including email)
CREATE POLICY "Institution admins read own institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (admin_user_id = auth.uid());
