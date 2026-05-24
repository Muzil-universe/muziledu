import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/institution/login")({
  head: () => ({ meta: [{ title: "Institution Login — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Institution Login"
          subtitle="Institution admin access only."
          mode="login"
          role="institution"
          loginRedirect="/institution"
          altLink={{ label: "Register your institution", to: "/institution/register" }}
        />
      </div>
    </div>
  ),
});
