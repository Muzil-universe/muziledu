
CREATE TABLE public.student_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  feature TEXT NOT NULL,
  topic TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert queries" ON public.student_queries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read queries" ON public.student_queries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can insert quiz results" ON public.quiz_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read quiz results" ON public.quiz_results FOR SELECT TO authenticated USING (true);
