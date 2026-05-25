import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Sparkles, BookOpen, ListChecks, FileText, Target, Globe2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MuzilAgents — AI-Powered Learning for Every Pakistani Student" },
      { name: "description", content: "Free AI study assistant aligned with Pakistan Vision 2030 and UN SDG 4." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient-soft opacity-60" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-gradient opacity-15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Aligned with UN SDG 4 · Pakistan Vision 2030
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              AI-Powered Learning for{" "}
              <span className="text-brand-gradient">Every Pakistani Student</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              MuzilAgents explains tough topics, generates quizzes, summarizes your notes, and builds 7-day study plans — free, fast, and built for our classrooms.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="group inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] hover:shadow-primary/40">
                Student Sign Up <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted transition">
                Student Login
              </Link>
            </div>

            {/* Badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <BadgeChip icon={<Target className="h-4 w-4" />} label="SDG 4 · Quality Education" tone="green" />
              <BadgeChip icon={<Globe2 className="h-4 w-4" />} label="Vision 2030 Aligned" tone="blue" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built for how Pakistani students learn</h2>
          <p className="mt-3 text-muted-foreground">Three AI tools designed for matric, FSc, and university coursework.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Explain Topics"
            desc="Get clear explanations of physics, math, biology, history — any subject, in simple language."
            tone="green"
          />
          <FeatureCard
            icon={<ListChecks className="h-6 w-6" />}
            title="Generate Quizzes"
            desc="Turn any topic into 5 multiple-choice questions to test yourself before exams."
            tone="blue"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Summarize Notes"
            desc="Paste long notes and get concise, exam-ready summaries in seconds."
            tone="green"
          />
        </div>
      </section>

      {/* Vision 2030 */}
      <section className="bg-brand-gradient-soft py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Pakistan Vision 2030</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">A digital-first generation of learners</h2>
            <p className="mt-4 text-muted-foreground">
              Pakistan Vision 2030 calls for an inclusive, skill-based education system that prepares our youth for a knowledge economy. MuzilAgents delivers free, personalized AI tutoring to every student with an internet connection — from Karachi to Gilgit.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Equal access to AI tutoring for underserved regions",
                "Bilingual-friendly explanations for diverse learners",
                "Data-driven insights for teachers and institutions",
                "Quality education aligned with UN SDG 4 targets",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gradient" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-soft p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white text-2xl font-bold">4</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UN Sustainable Development Goal</div>
                <div className="text-xl font-bold">Quality Education</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all."
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
              <FeatureBullet label="Free for all students" />
              <FeatureBullet label="AI-powered tools" />
              <FeatureBullet label="Built in Pakistan" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2025 MuzilAgents. Developed by Muzamil Habib. All Rights Reserved. Aligned with Pakistan Vision 2030 & UN SDG 4 Quality Education.
      </footer>
    </div>
  );
}

function BadgeChip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "green" | "blue" }) {
  const cls = tone === "green" ? "bg-brand-green-soft text-primary" : "bg-brand-blue-soft text-secondary";
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{icon}{label}</span>;
}

function FeatureCard({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc: string; tone: "green" | "blue" }) {
  const tint = tone === "green" ? "bg-brand-green-soft text-primary" : "bg-brand-blue-soft text-secondary";
  return (
    <div className="card-soft group p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function FeatureBullet({ label }: { label: string }) {
  return (
    <div className="rounded-md bg-brand-green-soft p-2 text-xs font-semibold text-primary">{label}</div>
  );
}
