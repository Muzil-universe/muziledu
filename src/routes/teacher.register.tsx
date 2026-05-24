import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/teacher/register")({
  head: () => ({ meta: [{ title: "Teacher Register — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Teacher Registration"
          subtitle="Create your teacher account to monitor student progress."
          mode="register"
          role="teacher"
          extraFields={[
            { name: "institution_name", label: "Institution Name", required: true },
            { name: "teacher_code", label: "Teacher Code (unique ID)", required: true },
          ]}
          loginRedirect="/teacher"
          altLink={{ label: "Already a teacher? Sign in", to: "/teacher/login" }}
        />
      </div>
    </div>
  ),
});
