import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/AppHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Create your creator profile — Crea-Link" },
      { name: "description", content: "Set up your Crea-Link profile: your craft, genres, skills and interests." },
      { property: "og:title", content: "Create your creator profile — Crea-Link" },
      { property: "og:description", content: "Set up your Crea-Link profile: your craft, genres, skills and interests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <Logo />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 2</p>
        <h1 className="mt-2 font-display text-5xl text-foreground">Tell the community who you are</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Your profile helps other creators find you for projects that fit your craft and genres.
        </p>
      </motion.div>
      <div className="surface rounded-[2rem] p-6 md:p-8">
        <ProfileForm submitLabel="Save & enter Crea-Link" onSaved={() => navigate({ to: "/feed", replace: true })} />
      </div>
    </div>
  );
}
