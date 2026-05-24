# MuzilAgents — Roles, Auth, Calculator & Cleanup

## 1. Database (one migration)

- Enum `app_role`: `student | teacher | institution`
- `institutions` — name (unique), email, city, type, admin_user_id
- `profiles` — user_id (PK→auth.users), full_name, email, role, institution_id, plus per-role fields:
  - student: university, current_cgpa, current_semester
  - teacher: institution_name, teacher_code (unique)
  - institution: city, type
- `user_roles` — (user_id, role) unique; security-definer `has_role()`
- `gpa_records` — user_id, semester_label, gpa, courses (jsonb), cumulative_cgpa
- Trigger on `auth.users` insert → create profile from `raw_user_meta_data` + insert into `user_roles`
- Tighten RLS on `student_queries` / `quiz_results`: insert requires `auth.uid()=user_id`; teachers read rows where the query owner's `institution_id` matches their own; institutions read all under their institution
- Auto-confirm email signups (so the demo flow works without SMTP setup)

## 2. Auth & access control

Six route files:
- `/login` + `/register` (student)
- `/teacher/login` + `/teacher/register`
- `/institution/login` + `/institution/register`

Each register form passes role-specific fields via `signUp({ options: { data: {...} }})`; the DB trigger reads them. Teacher signup auto-links to institution by name (creates a stub if missing). Institution signup creates the institution row + admin link.

Pathless layout routes (`beforeLoad` checks role via `has_role`):
- `_student.tsx` → wraps `/student` and `/calculator`
- `_teacher.tsx` → wraps `/teacher`
- `_institution.tsx` → wraps `/institution`

Wrong-role users are redirected to their own dashboard.

## 3. SiteHeader

- Shows "Welcome back, {full_name}" when logged in
- Logout button
- Nav links are role-filtered (student sees Student + Calculator, etc.)

## 4. `/calculator` (student-only)

- Dynamic course rows: name, credit hours, grade dropdown (A=4.0 … F=0.0)
- Live semester GPA, cumulative CGPA across saved semesters
- Red highlight for courses below the semester average
- Save semester to `gpa_records`
- "Analyze with AI" button → calls new `gpaSuggestions` server fn → shows weak subjects, study plan, "if you get A in X your CGPA becomes Y", motivational message tier by CGPA band

## 5. AI

Keep Gemini via the existing server function pattern (Lovable AI Gateway, `google/gemini-2.5-flash`). The key stays server-side — never exposed via `VITE_`. I'll mention this trade-off in the final reply. Add `gpaSuggestions` server fn.

## 6. Dashboards — real data only

- **Student**: greet by name, show CGPA / university / semester from profile; recent activity from `student_queries` + `quiz_results` filtered by `user_id`; empty states with friendly messages.
- **Teacher**: list students whose `institution_id` matches the teacher's; show name, CGPA, topics studied, quiz attempts. Empty state when none.
- **Institution**: list teachers + students under the institution with aggregate counts. Empty state when none.
- Remove all hardcoded numbers, mock arrays, fallback random values, fake "12k students", placeholder rows.

## 7. Files touched

New: 6 auth pages, 3 layout guards, `calculator.tsx`, expanded `ai.functions.ts`, `profile.functions.ts`.
Edited: `SiteHeader.tsx`, `student.tsx`, `teacher.tsx`, `institution.tsx`, `index.tsx` (remove fake stats), `__root.tsx` (auth listener for cache invalidation).
Migration: 1 file.

## Notes / trade-offs

- The Gemini key you pasted is treated as a server secret, not `VITE_`. Putting an AI key in `VITE_*` bundles it into every visitor's browser, where anyone can copy and abuse it (your quota, your bill). The server-function path already keeps requests gated by login.
- Auto-confirm signup is enabled so register → login works immediately without email setup; can be turned off later.
