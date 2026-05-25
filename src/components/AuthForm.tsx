import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Field = { name: string; label: string; type?: string; required?: boolean };

export function AuthCard({
  title,
  subtitle,
  mode,
  role,
  extraFields = [],
  loginRedirect,
  altLink,
}: {
  title: string;
  subtitle: string;
  mode: "login" | "register";
  role: "student" | "teacher" | "institution";
  extraFields?: Field[];
  loginRedirect: string;
  altLink: { label: string; to: string };
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function set(k: string, v: string) { setValues((s) => ({ ...s, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Validate CGPA if present
      if (mode === "register" && values.current_cgpa) {
        const cgpa = Number(values.current_cgpa);
        if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
          throw new Error("CGPA must be between 0.0 and 4.0");
        }
      }
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email, password: values.password,
        });
        if (error) throw error;
        // verify role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from("profiles").select("role,full_name").eq("user_id", user.id).maybeSingle();
          if (prof?.role && prof.role !== role) {
            await supabase.auth.signOut();
            throw new Error(`This account is registered as ${prof.role}. Please use the ${prof.role} login.`);
          }
          toast.success(`Welcome back, ${prof?.full_name ?? ""}!`);
        }
        navigate({ to: loginRedirect });
      } else {
        const meta: Record<string, string> = { role };
        for (const f of extraFields) meta[f.name] = values[f.name] ?? "";
        meta.full_name = values.full_name ?? meta.full_name ?? "";
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}${loginRedirect}`,
            data: meta,
          },
        });
        if (error) throw error;
        toast.success("Account created! Signing you in…");
        // since auto-confirm is on, sign in immediately
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email: values.email, password: values.password,
        });
        if (e2) throw e2;
        navigate({ to: loginRedirect });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const fields: Field[] = mode === "register"
    ? [{ name: "full_name", label: "Full Name", required: true }, ...extraFields,
       { name: "email", label: "Email", type: "email", required: true },
       { name: "password", label: "Password", type: "password", required: true }]
    : [{ name: "email", label: "Email", type: "email", required: true },
       { name: "password", label: "Password", type: "password", required: true }];

  return (
    <div className="mx-auto max-w-md">
      <div className="card-soft p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="text-xs font-medium">{f.label}</label>
              <input
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                type={f.type ?? "text"}
                required={f.required}
                minLength={f.type === "password" ? 6 : undefined}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <Link to={altLink.to} className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
          {altLink.label}
        </Link>
      </div>
    </div>
  );
}
