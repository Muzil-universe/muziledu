import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { gpaSuggestions } from "@/lib/ai.functions";
import { Plus, Trash2, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({
  head: () => ({ meta: [{ title: "GPA Calculator — MuzilAgents" }] }),
  component: CalcPage,
});

const GRADE_POINTS: Record<string, number> = {
  "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "D": 1.0, "F": 0.0,
};
const GRADES = Object.keys(GRADE_POINTS);

type Course = { name: string; credits: number; grade: string };

function CalcPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "student")) navigate({ to: "/login" });
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-6 py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Calculator profileCgpa={profile.current_cgpa} userId={profile.user_id} />
      </div>
    </div>
  );
}

function Calculator({ profileCgpa, userId }: { profileCgpa: number | null; userId: string }) {
  const [courses, setCourses] = useState<Course[]>([
    { name: "", credits: 3, grade: "A" },
    { name: "", credits: 3, grade: "B+" },
  ]);
  const [label, setLabel] = useState("Semester");
  const [history, setHistory] = useState<{ gpa: number; cumulative_cgpa: number | null }[]>([]);
  const [ai, setAi] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const aiFn = useServerFn(gpaSuggestions);

  useEffect(() => {
    supabase.from("gpa_records").select("gpa,cumulative_cgpa").eq("user_id", userId).order("created_at").then(({ data }) => {
      setHistory((data ?? []) as any);
    });
  }, [userId]);

  const { gpa, totalCredits, weakIdx } = useMemo(() => {
    const valid = courses.filter((c) => c.credits > 0 && c.grade in GRADE_POINTS);
    const tc = valid.reduce((s, c) => s + c.credits, 0);
    const tp = valid.reduce((s, c) => s + c.credits * GRADE_POINTS[c.grade], 0);
    const g = tc > 0 ? tp / tc : 0;
    const weak = new Set<number>();
    courses.forEach((c, i) => { if (c.credits > 0 && GRADE_POINTS[c.grade] < g - 0.3) weak.add(i); });
    return { gpa: g, totalCredits: tc, weakIdx: weak };
  }, [courses]);

  const cumulative = useMemo(() => {
    const prev = profileCgpa ?? (history.length ? history[history.length - 1].cumulative_cgpa ?? history[history.length - 1].gpa : null);
    if (prev == null) return gpa;
    const n = history.length + 1;
    return (prev * (n - 1) + gpa) / n;
  }, [history, gpa, profileCgpa]);

  function update(i: number, patch: Partial<Course>) {
    setCourses((cs) => cs.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  }
  function add() { setCourses((cs) => [...cs, { name: "", credits: 3, grade: "B" }]); }
  function remove(i: number) { setCourses((cs) => cs.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true);
    try {
      const validCourses = courses.filter(c => c.name && c.credits > 0);
      const { error } = await supabase.from("gpa_records").insert({
        user_id: userId,
        semester_label: label,
        gpa: Number(gpa.toFixed(2)),
        cumulative_cgpa: Number(cumulative.toFixed(2)),
        courses: validCourses as any,
      });
      if (error) throw error;
      await supabase.from("profiles").update({ current_cgpa: Number(cumulative.toFixed(2)) }).eq("user_id", userId);
      toast.success("Saved to your profile");
      const { data } = await supabase.from("gpa_records").select("gpa,cumulative_cgpa").eq("user_id", userId).order("created_at");
      setHistory((data ?? []) as any);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function analyze() {
    const valid = courses.filter(c => c.name && c.credits > 0);
    if (valid.length < 1) { toast.error("Add at least one course with a name"); return; }
    setAnalyzing(true); setAi(null);
    try {
      const r = await aiFn({ data: {
        currentGpa: Number(gpa.toFixed(2)),
        cumulativeCgpa: Number(cumulative.toFixed(2)),
        courses: valid.map(c => ({ name: c.name, credits: c.credits, grade: c.grade, points: GRADE_POINTS[c.grade] })),
      }});
      setAi(r);
    } catch (e: any) { toast.error(e.message); }
    finally { setAnalyzing(false); }
  }

  const motivation = cumulative >= 3.7 ? "Outstanding — you're at the top of your class. Keep pushing!"
    : cumulative >= 3.3 ? "Strong work. A little more focus on weaker subjects and you'll be in the top tier."
    : cumulative >= 2.7 ? "Solid foundation. Target your weak subjects — improvement is very achievable."
    : "You can turn this around. Start with one subject at a time. Consistency beats intensity.";

  return (
    <>
      <div className="card-soft p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GPA / CGPA Calculator</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pakistani 4.0 grading scale. Add your courses below.</p>
          </div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Semester label" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Course Name</th><th className="py-2">Credits</th><th className="py-2">Grade</th><th className="py-2">Points</th><th></th></tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const pulling = weakIdx.has(i);
                return (
                  <tr key={i} className={`border-b border-border last:border-0 ${pulling ? "bg-destructive/5" : ""}`}>
                    <td className="py-2 pr-2">
                      <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="e.g. Calculus I" className="w-full rounded-md border border-input bg-background px-2 py-1.5" />
                    </td>
                    <td className="py-2 pr-2 w-24">
                      <input type="number" min={0} max={6} value={c.credits} onChange={(e) => update(i, { credits: Number(e.target.value) })} className="w-20 rounded-md border border-input bg-background px-2 py-1.5" />
                    </td>
                    <td className="py-2 pr-2 w-28">
                      <select value={c.grade} onChange={(e) => update(i, { grade: e.target.value })} className="w-24 rounded-md border border-input bg-background px-2 py-1.5">
                        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className={`py-2 pr-2 w-20 font-semibold ${pulling ? "text-destructive" : ""}`}>{GRADE_POINTS[c.grade].toFixed(1)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => remove(i)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={add} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
          <Plus className="h-4 w-4" /> Add course
        </button>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Semester GPA" value={gpa.toFixed(2)} tone="green" />
          <Metric label="Cumulative CGPA" value={cumulative.toFixed(2)} tone="blue" />
          <Metric label="Total Credits" value={String(totalCredits)} tone="green" />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save semester
          </button>
          <button onClick={analyze} disabled={analyzing} className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyze with AI
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Courses highlighted in red are pulling your GPA down.</p>
      </div>

      {ai && (
        <div className="card-soft mt-6 p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> AI Analysis</div>

          <div className="mt-4 rounded-lg bg-brand-gradient-soft p-4 text-sm">{ai.motivation || motivation}</div>

          <h3 className="mt-6 font-semibold">Subjects to focus on</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {ai.weak_subjects?.map((w: any, i: number) => (
              <li key={i} className="rounded-md border border-border p-3"><strong>{w.name}</strong> — <span className="text-muted-foreground">{w.reason}</span></li>
            ))}
          </ul>

          <h3 className="mt-6 font-semibold">Personalized study plan</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {ai.study_plan?.map((s: string, i: number) => <li key={i}>{s}</li>)}
          </ul>

          <h3 className="mt-6 font-semibold">"What if" projections</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {ai.improvement_projections?.map((p: any, i: number) => (
              <li key={i} className="rounded-md border border-border p-3">
                If you get <strong>{p.new_grade}</strong> in <strong>{p.subject}</strong> → projected CGPA ≈ <strong className="text-primary">{p.projected_gpa.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" }) {
  const tint = tone === "green" ? "bg-brand-green-soft text-primary" : "bg-brand-blue-soft text-secondary";
  return (
    <div className={`rounded-xl p-5 ${tint}`}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
    </div>
  );
}
