import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Student Register — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Student Registration"
          subtitle="Join MuzilAgents — free AI study tools for Pakistani students."
          mode="register"
          role="student"
          extraFields={[
            { name: "university", label: "University / School", required: true },
            { name: "current_cgpa", label: "Current CGPA (e.g. 3.4)", type: "number" },
            { name: "current_semester", label: "Current Semester", type: "number" },
          ]}
          loginRedirect="/student"
          altLink={{ label: "Already have an account? Sign in", to: "/login" }}
        />
      </div>
    </div>
  ),
});
