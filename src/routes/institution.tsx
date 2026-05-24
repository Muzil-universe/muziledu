import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Download, GraduationCap, Users, Award, Loader2 } from "lucide-react";

export const Route = createFileRoute("/institution")({
  head: () => ({ meta: [{ title: "Institution Dashboard — MuzilAgents" }] }),
  component: InstitutionDash,
});

function InstitutionDash() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "institution")) navigate({ to: "/institution/login" });
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-6 py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <InstitutionView profile={profile} />
      </div>
    </div>
  );
}

function InstitutionView({ profile }: { profile: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: people } = await supabase.from("profiles").select("*").eq("institution_id", profile.institution_id);
      const studs = (people ?? []).filter((p) => p.role === "student");
      const teach = (people ?? []).filter((p) => p.role === "teacher");
      const ids = studs.map((s) => s.user_id);
      const [q, qr] = await Promise.all([
        ids.length ? supabase.from("student_queries").select("*").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from("quiz_results").select("*").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
      ]);
      setStudents(studs);
      setTeachers(teach);
      setQueries((q as any).data ?? []);
      setQuizzes((qr as any).data ?? []);
      setLoading(false);
    })();
  }, [profile.institution_id]);

  function exportCsv() {
    const header = "Name,Email,CGPA,Semester,Topics,Quizzes\n";
    const rows = students.map((s) => {
      const t = queries.filter((q) => q.user_id === s.user_id).length;
      const qz = quizzes.filter((q) => q.user_id === s.user_id).length;
      return `${s.full_name},${s.email},${s.current_cgpa ?? ""},${s.current_semester ?? ""},${t},${qz}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "muzilagents-students.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  const avgCgpa = students.length
    ? (students.filter((s) => s.current_cgpa != null).reduce((s, x) => s + Number(x.current_cgpa), 0) /
       Math.max(1, students.filter((s) => s.current_cgpa != null).length)).toFixed(2)
    : "—";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}!</h1>
          <p className="text-sm text-muted-foreground">{profile.institution_name} · {profile.city} · {profile.inst_type}</p>
        </div>
        {students.length > 0 && (
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Students" value={students.length} tone="green" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Teachers" value={teachers.length} tone="blue" />
        <StatCard icon={<Award className="h-5 w-5" />} label="Avg CGPA" value={avgCgpa} tone="green" />
        <StatCard icon={<Users className="h-5 w-5" />} label="AI Queries" value={queries.length} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-6">
          <h2 className="font-semibold">Teachers</h2>
          {teachers.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No teachers yet. Share the teacher registration link — they should enter "<strong>{profile.institution_name}</strong>" as institution name.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {teachers.map((t) => (
                <li key={t.user_id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span>{t.full_name}</span>
                  <span className="text-xs text-muted-foreground">{t.teacher_code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft p-6">
          <h2 className="font-semibold">Students</h2>
          {students.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {students.slice(0, 12).map((s) => (
                <li key={s.user_id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span>{s.full_name}</span>
                  <span className="text-xs text-muted-foreground">CGPA {s.current_cgpa != null ? Number(s.current_cgpa).toFixed(2) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
