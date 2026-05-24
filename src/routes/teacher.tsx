import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, Activity, Loader2 } from "lucide-react";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — MuzilAgents" }] }),
  component: TeacherDash,
});

function TeacherDash() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "teacher")) navigate({ to: "/teacher/login" });
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-6 py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <TeacherView profile={profile} />
      </div>
    </div>
  );
}

function TeacherView({ profile }: { profile: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: studs } = await supabase.from("profiles").select("*").eq("role", "student").eq("institution_id", profile.institution_id);
      const ids = (studs ?? []).map((s) => s.user_id);
      const [q, qr] = await Promise.all([
        ids.length ? supabase.from("student_queries").select("*").in("user_id", ids).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from("quiz_results").select("*").in("user_id", ids).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] as any[] }),
      ]);
      setStudents(studs ?? []);
      setQueries((q as any).data ?? []);
      setQuizzes((qr as any).data ?? []);
      setLoading(false);
    })();
  }, [profile.institution_id]);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}!</h1>
        <p className="text-sm text-muted-foreground">{profile.institution_name} · Teacher Code: <strong>{profile.teacher_code}</strong></p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={<Users className="h-5 w-5" />} label="Your Students" value={students.length} tone="green" />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="AI Queries" value={queries.length} tone="blue" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Quizzes Taken" value={quizzes.length} tone="green" />
      </div>

      <div className="card-soft mt-6 p-6">
        <h2 className="font-semibold">Students at {profile.institution_name}</h2>
        {students.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No students registered at your institution yet. Share the student registration link and have them enter "<strong>{profile.institution_name}</strong>" as their university to appear here.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Name</th><th className="py-2">CGPA</th><th className="py-2">Semester</th><th className="py-2">Topics</th><th className="py-2">Quizzes</th></tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const t = queries.filter((q) => q.user_id === s.user_id).length;
                  const qz = quizzes.filter((q) => q.user_id === s.user_id).length;
                  return (
                    <tr key={s.user_id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{s.full_name}</td>
                      <td className="py-3">{s.current_cgpa != null ? Number(s.current_cgpa).toFixed(2) : "—"}</td>
                      <td className="py-3">{s.current_semester ?? "—"}</td>
                      <td className="py-3">{t}</td>
                      <td className="py-3">{qz}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-soft mt-6 p-6">
        <h2 className="font-semibold">Recent Student Activity</h2>
        {queries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No AI activity yet from your students.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Student</th><th className="py-2">Feature</th><th className="py-2">Topic</th><th className="py-2">When</th></tr>
              </thead>
              <tbody>
                {queries.slice(0, 15).map((q) => {
                  const s = students.find((x) => x.user_id === q.user_id);
                  return (
                    <tr key={q.id} className="border-b border-border last:border-0">
                      <td className="py-3">{s?.full_name ?? "—"}</td>
                      <td className="py-3"><span className="rounded-full bg-brand-blue-soft px-2 py-0.5 text-xs font-semibold text-secondary capitalize">{q.feature}</span></td>
                      <td className="py-3 truncate max-w-xs">{q.topic}</td>
                      <td className="py-3 text-muted-foreground">{new Date(q.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: "green" | "blue" }) {
  const tint = tone === "green" ? "bg-brand-green-soft text-primary" : "bg-brand-blue-soft text-secondary";
  return (
    <div className="card-soft p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>{icon}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
