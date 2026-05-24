import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/teacher/login")({
  head: () => ({ meta: [{ title: "Teacher Login — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Teacher Login"
          subtitle="Sign in to view students from your institution."
          mode="login"
          role="teacher"
          loginRedirect="/teacher"
          altLink={{ label: "New teacher? Register here", to: "/teacher/register" }}
        />
      </div>
    </div>
  ),
});
