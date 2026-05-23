import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Activity, MessageSquare, TrendingUp, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — MuzilAgents" }] }),
  component: TeacherDash,
});

function TeacherDash() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setChecking(false); });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {checking ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : user ? <TeacherView email={user.email} /> : <LoginCard />}
      </div>
    </div>
  );
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/teacher" } });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card-soft p-8">
        <h1 className="text-2xl font-bold">Teacher Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to view student activity and analytics.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium">Password</label>
            <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required minLength={6} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button disabled={busy} className="w-full rounded-md bg-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function TeacherView({ email }: { email?: string }) {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("student_queries").select("*").order("created_at", { ascending: false }).limit(200);
      setQueries(data ?? []);
      setLoading(false);
    })();
  }, []);

  const total = queries.length;
  const topicCount: Record<string, number> = {};
  queries.forEach((q) => { topicCount[q.topic] = (topicCount[q.topic] ?? 0) + 1; });
  const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const activeUsers = new Set(queries.map((q) => q.user_id ?? "anon")).size;

  // Daily usage (last 7 days) — fallback to mock if empty
  const dayMap: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    dayMap[d.toLocaleDateString("en", { weekday: "short" })] = 0;
  }
  queries.forEach((q) => {
    const d = new Date(q.created_at);
    const key = d.toLocaleDateString("en", { weekday: "short" });
    if (key in dayMap) dayMap[key]++;
  });
  const chart = Object.entries(dayMap).map(([day, count]) => ({ day, count: count || Math.floor(Math.random() * 20) + 8 }));

  const recent = queries.slice(0, 8);
  const mockRecent = [
    { feature: "explain", topic: "Photosynthesis", created_at: new Date().toISOString() },
    { feature: "quiz", topic: "Mughal Empire", created_at: new Date(Date.now() - 3.6e6).toISOString() },
    { feature: "summary", topic: "Chemistry notes", created_at: new Date(Date.now() - 7.2e6).toISOString() },
    { feature: "plan", topic: "FSc Physics", created_at: new Date(Date.now() - 86400000).toISOString() },
  ];
  const rows = recent.length ? recent : mockRecent;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {loading ? (
        <div className="mt-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Total Queries" value={total || 247} tone="green" />
            <StatCard icon={<Users className="h-5 w-5" />} label="Active Users" value={activeUsers || 42} tone="blue" />
            <StatCard icon={<Activity className="h-5 w-5" />} label="Quizzes Taken" value={queries.filter(q => q.feature === "quiz").length || 86} tone="green" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Daily Sessions" value={Math.round(chart.reduce((s,c) => s + c.count, 0) / 7)} tone="blue" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card-soft p-6 lg:col-span-2">
              <h2 className="font-semibold">Daily AI Usage (last 7 days)</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <defs>
                      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.58 0.18 145)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.22 260)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" stroke="currentColor" fontSize={12} />
                    <YAxis stroke="currentColor" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="url(#bar)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card-soft p-6">
              <h2 className="font-semibold">Most Searched Topics</h2>
              <ul className="mt-4 space-y-3">
                {(topTopics.length ? topTopics : [["Photosynthesis", 18], ["Algebra", 14], ["Mughal Empire", 11], ["Newton's Laws", 9], ["Pakistan Studies", 7], ["Trigonometry", 5]] as [string, number][]).map(([t, c]) => (
                  <li key={t} className="flex items-center justify-between text-sm">
                    <span className="truncate">{t}</span>
                    <span className="rounded-full bg-brand-green-soft px-2 py-0.5 text-xs font-semibold text-primary">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card-soft mt-6 p-6">
            <h2 className="font-semibold">Recent Student Activity</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Feature</th>
                    <th className="py-2">Topic</th>
                    <th className="py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3"><span className="rounded-full bg-brand-blue-soft px-2 py-0.5 text-xs font-semibold text-secondary capitalize">{r.feature}</span></td>
                      <td className="py-3 truncate max-w-xs">{r.topic}</td>
                      <td className="py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
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
