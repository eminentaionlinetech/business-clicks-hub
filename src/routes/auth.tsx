import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Eminent Clicks" },
      {
        name: "description",
        content: "Sign in to your Eminent Clicks account to open your business tools.",
      },
      { property: "og:title", content: "Sign in — Eminent Clicks" },
      {
        property: "og:description",
        content: "One login for SubTrack, JobFlow, PayChaser, ReportSnap and ClaimDesk.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-10">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-24 h-80 w-80 rounded-full bg-mint/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[400px]">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Eminent Clicks
          </span>
        </Link>

        <h1 className="mt-10 font-display text-[30px] font-semibold leading-[1.05]">
          One login. Pay once, unlock instantly.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {mode === "signin"
            ? "Welcome back. Sign in to open your tools."
            : "Create your account to get started."}
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl bg-mint/10 p-5 ring-1 ring-mint/30">
            <p className="font-display text-[15px] font-semibold text-mint">Check your email</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              We sent a confirmation link to {email}. Click it, then come back and sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
              className="mt-4 text-[13px] font-semibold text-amber"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-card px-3 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-amber"
                placeholder="you@business.ng"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-card px-3 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-amber"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-amber py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mt-5 text-center text-[13px] text-muted-foreground">
            {mode === "signin" ? "New to Eminent Clicks?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-amber"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
