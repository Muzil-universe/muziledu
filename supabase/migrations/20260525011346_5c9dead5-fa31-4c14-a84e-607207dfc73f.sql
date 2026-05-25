
DROP VIEW IF EXISTS public.institutions_public;

-- Restore broad read but at column level, hiding sensitive columns
CREATE POLICY "Anyone authenticated reads institutions"
ON public.institutions
FOR SELECT
TO authenticated
USING (true);

-- Revoke column-level SELECT on sensitive columns from general roles
REVOKE SELECT (email, admin_user_id) ON public.institutions FROM authenticated, anon;

-- Re-grant safe columns explicitly
GRANT SELECT (id, name, city, type, created_at) ON public.institutions TO authenticated, anon;
