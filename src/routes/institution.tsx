import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Download, Target, Globe2, GraduationCap, Award } from "lucide-react";

export const Route = createFileRoute("/institution")({
  head: () => ({ meta: [{ title: "Institution Dashboard — EduAI Agent" }] }),
  component: InstitutionDash,
});

const students = [
  { name: "Ayesha Khan", topics: 14, quizzes: 9, avg: 87 },
  { name: "Bilal Ahmed", topics: 11, quizzes: 7, avg: 78 },
  { name: "Fatima Noor", topics: 18, quizzes: 12, avg: 92 },
  { name: "Hamza Ali", topics: 9, quizzes: 5, avg: 71 },
  { name: "Maryam Iqbal", topics: 15, quizzes: 10, avg: 85 },
  { name: "Usman Tariq", topics: 7, quizzes: 4, avg: 68 },
  { name: "Zainab Raza", topics: 13, quizzes: 8, avg: 81 },
];

function InstitutionDash() {
  function exportCsv() {
    const header = "Name,Topics Studied,Quizzes Taken,Avg Score (%)\n";
    const rows = students.map(s => `${s.name},${s.topics},${s.quizzes},${s.avg}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "eduai-students.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalStudents = 1248;
  const totalSessions = 8642;
  const avgScore = Math.round(students.reduce((s, x) => s + x.avg, 0) / students.length);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Institution Dashboard</h1>
            <p className="text-sm text-muted-foreground">Aggregate insights across your students.</p>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:scale-[1.02] transition">
            <Download className="h-4 w-4" /> Export to CSV
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Total Students" value={totalStudents.toLocaleString()} tone="green" />
          <StatCard icon={<Globe2 className="h-5 w-5" />} label="Total Sessions" value={totalSessions.toLocaleString()} tone="blue" />
          <StatCard icon={<Award className="h-5 w-5" />} label="Avg Quiz Score" value={`${avgScore}%`} tone="green" />
        </div>

        {/* Performance table */}
        <div className="card-soft mt-6 p-6">
          <h2 className="font-semibold">Student Performance</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Student</th><th className="py-2">Topics</th><th className="py-2">Quizzes</th><th className="py-2">Avg Score</th><th className="py-2">Progress</th></tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.name} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3">{s.topics}</td>
                    <td className="py-3">{s.quizzes}</td>
                    <td className="py-3">{s.avg}%</td>
                    <td className="py-3 w-48">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-brand-gradient" style={{ width: `${s.avg}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vision 2030 + SDG */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-6 lg:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
              <Globe2 className="h-4 w-4" /> Pakistan Vision 2030 Alignment
            </div>
            <h2 className="mt-2 text-xl font-bold">How EduAI Agent meets national goals</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Universal access to quality education", "Free AI tutoring for any student with internet — bridges rural-urban gaps."],
                ["Skill-based, future-ready learners", "Builds analytical thinking through quizzes and structured study plans."],
                ["Digital transformation of education", "Adopts modern AI in classrooms, supporting teachers with analytics."],
                ["Inclusive growth & social equity", "Same tool, same quality — for students in Lahore, Quetta, or Skardu."],
              ].map(([goal, how]) => (
                <li key={goal} className="rounded-lg border border-border p-4">
                  <div className="font-semibold">{goal}</div>
                  <div className="text-muted-foreground">{how}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-soft bg-brand-gradient-soft p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-bold text-white">4</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UN SDG</div>
                <div className="text-lg font-bold">Quality Education</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Our progress across SDG 4 targets, based on platform usage.</p>
            <div className="mt-5 space-y-4">
              <Progress label="Equitable access" value={86} />
              <Progress label="Learning outcomes" value={78} />
              <Progress label="Teacher support" value={64} />
              <Progress label="Digital literacy" value={91} />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Target className="h-3.5 w-3.5" /> 80% overall progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "green" | "blue" }) {
  const tint = tone === "green" ? "bg-brand-green-soft text-primary" : "bg-brand-blue-soft text-secondary";
  return (
    <div className="card-soft p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>{icon}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><span className="font-semibold">{value}%</span></div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-card">
        <div className="h-full bg-brand-gradient" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
