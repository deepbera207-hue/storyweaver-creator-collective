import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { AppHeader, MobileNav } from "@/components/layout/AppHeader";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hydrated, me } = useStore();
  const navigate = useNavigate();
  const onboarding = pathname === "/onboarding";
  const needsProfile = hydrated && (!me || !me.onboarded);

  // New accounts finish profile creation before entering the community.
  useEffect(() => {
    if (needsProfile && !onboarding) navigate({ to: "/onboarding", replace: true });
  }, [needsProfile, onboarding, navigate]);

  if (!hydrated || (needsProfile && !onboarding)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="loader-orb" aria-hidden />
        <p className="text-sm text-muted-foreground">Opening Crea-Link…</p>
      </div>
    );
  }

  if (onboarding) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-4 py-10 md:py-16"
      >
        <Outlet />
      </motion.main>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <motion.main
        key={pathname.split("/")[1]}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10"
      >
        <Outlet />
      </motion.main>
      <MobileNav />
    </div>
  );
}
