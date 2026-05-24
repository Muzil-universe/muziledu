
-- Enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'institution');

-- Institutions
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  email text,
  city text,
  type text,
  admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role public.app_role NOT NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  institution_name text,
  university text,
  current_cgpa numeric(4,2),
  current_semester int,
  teacher_code text UNIQUE,
  city text,
  inst_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_institution(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT institution_id FROM public.profiles WHERE user_id=_user_id
$$;

-- GPA records
CREATE TABLE public.gpa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_label text NOT NULL,
  gpa numeric(4,2) NOT NULL,
  cumulative_cgpa numeric(4,2),
  courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gpa_records ENABLE ROW LEVEL SECURITY;

-- Signup trigger: read raw_user_meta_data and populate profile + role + institution
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_inst_id uuid;
  v_inst_name text;
BEGIN
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student')::public.app_role;
  v_inst_name := NEW.raw_user_meta_data->>'institution_name';

  IF v_role = 'institution' THEN
    INSERT INTO public.institutions (name, email, city, type, admin_user_id)
    VALUES (
      v_inst_name,
      NEW.email,
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'inst_type',
      NEW.id
    )
    ON CONFLICT (name) DO UPDATE SET admin_user_id = EXCLUDED.admin_user_id
    RETURNING id INTO v_inst_id;
  ELSIF v_inst_name IS NOT NULL AND v_inst_name <> '' THEN
    -- For teacher / student: link to institution by name, creating a stub if needed
    INSERT INTO public.institutions (name) VALUES (v_inst_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_inst_id;
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name, email, role, institution_id, institution_name,
    university, current_cgpa, current_semester, teacher_code, city, inst_type
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    v_inst_id,
    v_inst_name,
    NEW.raw_user_meta_data->>'university',
    NULLIF(NEW.raw_user_meta_data->>'current_cgpa','')::numeric,
    NULLIF(NEW.raw_user_meta_data->>'current_semester','')::int,
    NEW.raw_user_meta_data->>'teacher_code',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'inst_type'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: profiles
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers read same-institution profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher')
    AND institution_id = public.get_user_institution(auth.uid())
  );
CREATE POLICY "Institutions read own institution profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'institution')
    AND institution_id = public.get_user_institution(auth.uid())
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS: user_roles (read own)
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: institutions
CREATE POLICY "Anyone authenticated reads institutions" ON public.institutions
  FOR SELECT TO authenticated USING (true);

-- RLS: gpa_records
CREATE POLICY "Users CRUD own gpa" ON public.gpa_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read same-institution gpa" ON public.gpa_records
  FOR SELECT USING (
    public.has_role(auth.uid(),'teacher')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );
CREATE POLICY "Institutions read own gpa" ON public.gpa_records
  FOR SELECT USING (
    public.has_role(auth.uid(),'institution')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );

-- Tighten existing tables
DROP POLICY IF EXISTS "Authenticated can read quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Insert own or anonymous quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Authenticated can read queries" ON public.student_queries;
DROP POLICY IF EXISTS "Insert own or anonymous queries" ON public.student_queries;

CREATE POLICY "Users insert own queries" ON public.student_queries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own queries" ON public.student_queries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers read same-institution queries" ON public.student_queries
  FOR SELECT USING (
    public.has_role(auth.uid(),'teacher')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );
CREATE POLICY "Institutions read own queries" ON public.student_queries
  FOR SELECT USING (
    public.has_role(auth.uid(),'institution')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );

CREATE POLICY "Users insert own quiz results" ON public.quiz_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own quiz results" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers read same-institution quiz results" ON public.quiz_results
  FOR SELECT USING (
    public.has_role(auth.uid(),'teacher')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );
CREATE POLICY "Institutions read own quiz results" ON public.quiz_results
  FOR SELECT USING (
    public.has_role(auth.uid(),'institution')
    AND user_id IN (SELECT user_id FROM public.profiles WHERE institution_id = public.get_user_institution(auth.uid()))
  );
