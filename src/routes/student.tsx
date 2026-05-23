import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { explainTopic, summarizeNotes, generateQuiz, studyPlan } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ListChecks, FileText, CalendarDays, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Tab = "explain" | "quiz" | "summary" | "plan";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student Dashboard — MuzilAgents" }] }),
  component: StudentDash,
});

function StudentDash() {
  const [tab, setTab] = useState<Tab>("explain");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="card-soft p-2">
            <SidebarBtn icon={<BookOpen className="h-4 w-4" />} label="Explain Topic" active={tab === "explain"} onClick={() => setTab("explain")} />
            <SidebarBtn icon={<ListChecks className="h-4 w-4" />} label="Quiz Generator" active={tab === "quiz"} onClick={() => setTab("quiz")} />
            <SidebarBtn icon={<FileText className="h-4 w-4" />} label="Note Summarizer" active={tab === "summary"} onClick={() => setTab("summary")} />
            <SidebarBtn icon={<CalendarDays className="h-4 w-4" />} label="Study Plan" active={tab === "plan"} onClick={() => setTab("plan")} />
          </div>
          <div className="card-soft mt-4 bg-brand-gradient-soft p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />Pro tip</div>
            <p className="mt-2 text-xs text-muted-foreground">Be specific — "Newton's third law with examples" works better than "physics".</p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
            {(["explain", "quiz", "summary", "plan"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t}</button>
            ))}
          </div>
          {tab === "explain" && <ExplainPanel />}
          {tab === "quiz" && <QuizPanel />}
          {tab === "summary" && <SummaryPanel />}
          {tab === "plan" && <PlanPanel />}
        </main>
      </div>
    </div>
  );
}

function SidebarBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-gradient text-white shadow-sm" : "hover:bg-muted"}`}>
      {icon}{label}
    </button>
  );
}

function PanelShell({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card-soft p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Spinner({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}
    </div>
  );
}

function ResponseCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-brand-gradient-soft p-5 leading-relaxed">{children}</div>;
}

async function logQuery(feature: string, topic: string, response: string) {
  try { await supabase.from("student_queries").insert({ feature, topic, response: response.slice(0, 2000) }); } catch {}
}

function ExplainPanel() {
  const [topic, setTopic] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(explainTopic);
  async function run() {
    if (!topic.trim()) return;
    setLoading(true); setOut("");
    try {
      const r = await fn({ data: { topic } });
      setOut(r.text);
      logQuery("explain", topic, r.text);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  return (
    <PanelShell title="Topic Explainer" desc="Get a clear, simple explanation of any topic.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis, Pythagoras theorem, French Revolution" className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button onClick={run} disabled={loading} className="rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50">Explain</button>
      </div>
      <div className="mt-5">
        {loading && <Spinner />}
        {out && !loading && <ResponseCard><Markdown text={out} /></ResponseCard>}
      </div>
    </PanelShell>
  );
}

function SummaryPanel() {
  const [notes, setNotes] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(summarizeNotes);
  async function run() {
    if (notes.trim().length < 10) { toast.error("Paste at least a paragraph."); return; }
    setLoading(true); setOut("");
    try {
      const r = await fn({ data: { notes } });
      setOut(r.text);
      logQuery("summary", notes.slice(0, 80), r.text);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  return (
    <PanelShell title="Note Summarizer" desc="Paste long notes and get an exam-ready summary.">
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Paste your notes here…" className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      <button onClick={run} disabled={loading} className="mt-3 rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50">Summarize</button>
      <div className="mt-5">
        {loading && <Spinner />}
        {out && !loading && <ResponseCard><Markdown text={out} /></ResponseCard>}
      </div>
    </PanelShell>
  );
}

function QuizPanel() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; answer_index: number; explanation: string }[] | null>(null);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(generateQuiz);
  async function run() {
    if (!topic.trim()) return;
    setLoading(true); setQuiz(null); setPicks({}); setSubmitted(false);
    try {
      const r = await fn({ data: { topic } });
      setQuiz(r.questions);
      logQuery("quiz", topic, "");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  async function submit() {
    if (!quiz) return;
    const score = quiz.reduce((s, q, i) => s + (picks[i] === q.answer_index ? 1 : 0), 0);
    setSubmitted(true);
    try { await supabase.from("quiz_results").insert({ topic, score, total: quiz.length }); } catch {}
    toast.success(`You scored ${score} / ${quiz.length}`);
  }
  return (
    <PanelShell title="Quiz Generator" desc="Generate 5 multiple-choice questions on any topic.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Mughal Empire, Algebra basics" className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button onClick={run} disabled={loading} className="rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50">Generate Quiz</button>
      </div>
      <div className="mt-5 space-y-4">
        {loading && <Spinner label="Building your quiz…" />}
        {quiz?.map((q, i) => (
          <div key={i} className="card-soft p-5">
            <div className="font-semibold">{i + 1}. {q.question}</div>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => {
                const chosen = picks[i] === oi;
                const correct = submitted && oi === q.answer_index;
                const wrong = submitted && chosen && oi !== q.answer_index;
                return (
                  <button key={oi} disabled={submitted} onClick={() => setPicks((p) => ({ ...p, [i]: oi }))}
                    className={`rounded-md border px-4 py-2 text-left text-sm transition
                      ${correct ? "border-primary bg-brand-green-soft text-primary" :
                        wrong ? "border-destructive bg-destructive/10 text-destructive" :
                        chosen ? "border-secondary bg-brand-blue-soft" : "border-border hover:bg-muted"}`}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                );
              })}
            </div>
            {submitted && <p className="mt-3 text-xs text-muted-foreground"><strong>Why:</strong> {q.explanation}</p>}
          </div>
        ))}
        {quiz && !submitted && (
          <button onClick={submit} className="rounded-md bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90">Submit Answers</button>
        )}
      </div>
    </PanelShell>
  );
}

function PlanPanel() {
  const [subject, setSubject] = useState("");
  const [plan, setPlan] = useState<{ day: number; topic: string; tasks: string[]; hours: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(studyPlan);
  async function run() {
    if (!subject.trim()) return;
    setLoading(true); setPlan(null);
    try {
      const r = await fn({ data: { subject } });
      setPlan(r.days);
      logQuery("plan", subject, "");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  return (
    <PanelShell title="7-Day Study Plan" desc="Tell us a subject — we'll build a focused weekly plan.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. FSc Physics chapter 4, O-Level chemistry" className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button onClick={run} disabled={loading} className="rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50">Generate Plan</button>
      </div>
      <div className="mt-5 grid gap-3">
        {loading && <Spinner label="Planning your week…" />}
        {plan?.map((d) => (
          <div key={d.day} className="card-soft flex gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-gradient font-bold text-white">D{d.day}</div>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-semibold">{d.topic}</div>
                <span className="text-xs text-muted-foreground">{d.hours}h</span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {d.tasks.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

// Minimal markdown-ish renderer (headings, bullets, bold)
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="prose-sm text-sm">
      {lines.map((l, i) => {
        if (/^#+\s/.test(l)) {
          const lvl = l.match(/^#+/)![0].length;
          const content = l.replace(/^#+\s/, "");
          const Tag = (`h${Math.min(lvl + 2, 6)}` as any);
          return <Tag key={i} className="mt-3 font-bold">{content}</Tag>;
        }
        if (/^\s*[-*]\s/.test(l)) return <li key={i} className="ml-5 list-disc">{inline(l.replace(/^\s*[-*]\s/, ""))}</li>;
        if (!l.trim()) return <div key={i} className="h-2" />;
        return <p key={i} className="mt-2">{inline(l)}</p>;
      })}
    </div>
  );
}
function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
}
