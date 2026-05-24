import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthCard } from "@/components/AuthForm";

export const Route = createFileRoute("/institution/register")({
  head: () => ({ meta: [{ title: "Institution Register — MuzilAgents" }] }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <AuthCard
          title="Institution Registration"
          subtitle="Set up your institution's MuzilAgents workspace."
          mode="register"
          role="institution"
          extraFields={[
            { name: "institution_name", label: "Institution Name", required: true },
            { name: "city", label: "City", required: true },
            { name: "inst_type", label: "Type (University / College / School)", required: true },
          ]}
          loginRedirect="/institution"
          altLink={{ label: "Already registered? Sign in", to: "/institution/login" }}
        />
      </div>
    </div>
  ),
});
