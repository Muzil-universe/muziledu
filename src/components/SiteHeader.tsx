import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg">EduAI <span className="text-brand-gradient">Agent</span></span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link to="/student" className="rounded-md px-3 py-2 hover:bg-muted transition" activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary" }}>Student</Link>
          <Link to="/teacher" className="rounded-md px-3 py-2 hover:bg-muted transition" activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary" }}>Teacher</Link>
          <Link to="/institution" className="rounded-md px-3 py-2 hover:bg-muted transition" activeProps={{ className: "rounded-md px-3 py-2 bg-muted text-primary" }}>Institution</Link>
        </nav>
      </div>
    </header>
  );
}
