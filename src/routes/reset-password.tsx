import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/AppHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Crea-Link" },
      { name: "description", content: "Set a new password for your Crea-Link account." },
      { property: "og:title", content: "Choose a new password — Crea-Link" },
      { property: "og:description", content: "Set a new password for your Crea-Link account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/feed" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-70" />
      <div className="surface relative w-full max-w-md rounded-[2rem] p-8 shadow-lift">
        <Logo to="/" />
        <h1 className="mt-8 font-display text-4xl">Choose a new password</h1>
        {ready ? (
          <form onSubmit={save} className="mt-6 space-y-3">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="auth-input"
              autoComplete="new-password"
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              Save password
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Open this page from the reset link in your email.</p>
        )}
      </div>
    </div>
  );
}
