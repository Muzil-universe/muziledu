import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Student Login — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Student Login"
          subtitle="Sign in to access your dashboard and GPA calculator."
          mode="login"
          role="student"
          loginRedirect="/student"
          altLink={{ label: "Don't have an account? Register here", to: "/register" }}
        />
      </div>
    </div>
  ),
});
