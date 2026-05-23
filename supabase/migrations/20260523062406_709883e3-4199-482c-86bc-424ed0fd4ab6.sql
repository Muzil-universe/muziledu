
DROP POLICY "Anyone can insert queries" ON public.student_queries;
DROP POLICY "Anyone can insert quiz results" ON public.quiz_results;

CREATE POLICY "Insert own or anonymous queries" ON public.student_queries
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Insert own or anonymous quiz results" ON public.quiz_results
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
