import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  user_id: string;
  full_name: string;
  email: string;
  role: "student" | "teacher" | "institution";
  institution_id: string | null;
  institution_name: string | null;
  university: string | null;
  current_cgpa: number | null;
  current_semester: number | null;
  teacher_code: string | null;
  city: string | null;
  inst_type: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile(u: User | null) {
      if (!u) { setProfile(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.id).maybeSingle();
      if (!cancelled) setProfile(data as Profile | null);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      // defer to avoid deadlock
      setTimeout(() => { loadProfile(s?.user ?? null); }, 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user ?? null);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  }

  return { user, profile, loading, signOut };
}
