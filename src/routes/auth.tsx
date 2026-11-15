import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/AppHeader";
import { useStore } from "@/lib/store";

type AuthSearch = { mode?: "signin" | "signup" | undefined; redirect?: string | undefined };

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    mode: s["mode"] === "signup" ? "signup" : s["mode"] === "signin" ? "signin" : undefined,
    redirect: safeRedirect(s["redirect"]),
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join — Crea-Link" },
      { name: "description", content: "Create your Crea-Link account or sign in to collaborate with creators." },
      { property: "og:title", content: "Sign in or join — Crea-Link" },
      { property: "og:description", content: "Create your Crea-Link account or sign in to collaborate with creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const POST_AUTH_KEY = "crealink_post_auth_redirect";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const { user, authReady } = useStore();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Signed in (including after an OAuth round-trip) → continue to the app.
  useEffect(() => {
    if (!authReady || !user) return;
    let dest = search.redirect;
    try {
      dest = dest ?? safeRedirect(sessionStorage.getItem(POST_AUTH_KEY));
      sessionStorage.removeItem(POST_AUTH_KEY);
    } catch {
      /* storage unavailable */
    }
    router.history.replace(dest ?? "/feed");
  }, [authReady, user, search.redirect, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) setSentTo(email);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox for a password reset link.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "lovable") => {
    try {
      if (search.redirect) sessionStorage.setItem(POST_AUTH_KEY, search.redirect);
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed. Please try again.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="hero-atmosphere pointer-events-none absolute inset-0 opacity-70" />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="surface relative w-full max-w-md rounded-[2rem] p-8 shadow-lift md:p-10"
      >
        <Logo to="/" />
        <AnimatePresence mode="wait">
          {sentTo ? (
            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
              <MailCheck className="mx-auto size-10 text-muted-foreground" />
              <h1 className="mt-4 font-display text-3xl">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{sentTo}</span>. Open it to
                activate your account, then you'll set up your creator profile.
              </p>
              <Button variant="ghost" className="mt-6" onClick={() => (setSentTo(null), setMode("signin"))}>
                Back to sign in
              </Button>
            </motion.div>
          ) : (
            <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="mt-8 font-display text-4xl text-foreground">
                {mode === "signup" ? "Join Crea-Link" : mode === "signin" ? "Welcome back" : "Reset your password"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Create an account, then build your creator profile."
                  : mode === "signin"
                    ? "Sign in to your creative community."
                    : "We'll email you a link to choose a new password."}
              </p>

              {mode !== "forgot" && (
                <div className="mt-6 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => void oauth("google")}
                    className="google-btn flex h-11 w-full items-center justify-center gap-2.5 rounded-full px-3 text-sm font-medium"
                  >
                    <GoogleLogo /> Continue with Google
                  </button>
                  <button type="button" className="lovable-auth-button w-full" onClick={() => void oauth("lovable")}>
                    Continue with Lovable
                  </button>
                  <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}

              <form onSubmit={submit} className={mode === "forgot" ? "mt-6 space-y-3" : "space-y-3"}>
                {mode === "signup" && (
                  <Field label="Full name">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className="auth-input" autoComplete="name" />
                  </Field>
                )}
                <Field label="Email">
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" autoComplete="email" />
                </Field>
                {mode !== "forgot" && (
                  <Field label="Password">
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                  </Field>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
                </Button>
              </form>

              <div className="mt-5 flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                {mode === "signin" && (
                  <>
                    <button className="hover:text-foreground" onClick={() => setMode("forgot")}>
                      Forgot your password?
                    </button>
                    <p>
                      New here?{" "}
                      <button className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
                        Create an account
                      </button>
                    </p>
                  </>
                )}
                {mode !== "signin" && (
                  <p>
                    Already a member?{" "}
                    <button className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
                      Sign in
                    </button>
                  </p>
                )}
                <Link to="/" className="mt-2 text-xs hover:text-foreground">
                  ← Back to home
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
