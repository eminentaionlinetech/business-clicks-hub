import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { TOOLS, naira } from "@/lib/tools";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eminent Clicks — Five business tools, one login" },
      {
        name: "description",
        content:
          "Pay once by bank transfer, upload your receipt and unlock SubTrack, JobFlow, PayChaser, ReportSnap or ClaimDesk instantly.",
      },
      { property: "og:title", content: "Eminent Clicks — Five business tools, one login" },
      {
        property: "og:description",
        content:
          "Naira-priced tools for Nigerian small business. One login. Pay once, unlock instantly.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("admin") === "true") {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-24 h-80 w-80 rounded-full bg-mint/10 blur-3xl" />

      <div className="relative mx-auto max-w-[400px] px-5 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo />
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Eminent Clicks
            </span>
          </div>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold ring-1 ring-border"
          >
            {loading ? "…" : user ? "My Dashboard" : "Sign in"}
          </Link>
        </div>

        <div className="mt-8">
          <span className="rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-medium text-amber ring-1 ring-amber/25">
            Naira-denominated suite
          </span>
        </div>
        <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] text-balance">
          One login. Pay once, unlock instantly.
        </h1>
        <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Five focused tools for Nigerian small business. Keep the one you pay for, open the rest
          whenever you're ready.
        </p>

        <Link
          to={user ? "/dashboard" : "/auth"}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-amber py-3.5 text-sm font-semibold text-primary-foreground"
        >
          {user ? "Open my dashboard" : "Get started"}
        </Link>

        <div className="mt-10 flex items-end justify-between">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            The suite
          </span>
          <span className="text-[12px] text-muted-foreground">5 tools</span>
        </div>

        <div className="mt-4 space-y-3">
          {TOOLS.map((tool) => (
            <div
              key={tool.key}
              className="locked-shutter rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-secondary ring-1 ring-border">
                  <span className="font-display text-sm font-semibold text-muted-foreground">
                    {tool.initials}
                  </span>
                </div>
                <div>
                  <span className="font-display text-[17px] font-semibold">{tool.name}</span>
                  <p className="text-[13px] text-muted-foreground">{tool.tagline}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-2xl font-semibold leading-none">
                  {naira(tool.price)}
                  <span className="text-sm font-medium text-muted-foreground"> once</span>
                </span>
                <Link
                  to={user ? "/dashboard" : "/auth"}
                  className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Subscribe
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
