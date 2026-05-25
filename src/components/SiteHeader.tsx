import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Calculator as CalcIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg">Muzil<span className="text-brand-gradient">Agents</span></span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link to="/" className="rounded-md px-3 py-2 hover:bg-muted transition" activeOptions={{ exact: true }} activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary" }}>Home</Link>
          {profile?.role === "student" && (
            <>
              <Link to="/student" className="rounded-md px-3 py-2 hover:bg-muted transition" activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary" }}>Student</Link>
              <Link to="/calculator" className="rounded-md px-3 py-2 hover:bg-muted transition inline-flex items-center gap-1" activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary inline-flex items-center gap-1" }}>
                <CalcIcon className="h-3.5 w-3.5" /> Calculator
              </Link>
            </>
          )}

          {profile ? (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">Welcome back, <strong className="text-foreground">{profile.full_name.split(" ")[0]}</strong></span>
              <button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="ml-2 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
