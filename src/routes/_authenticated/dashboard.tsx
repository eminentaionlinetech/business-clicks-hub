import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PaymentModal } from "@/components/payment-modal";
import { supabase } from "@/integrations/supabase/client";
import { TOOLS, naira, type Tool } from "@/lib/tools";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Eminent Clicks" },
      {
        name: "description",
        content: "Unlock and open your Eminent Clicks business tools from one dashboard.",
      },
      { property: "og:title", content: "My Dashboard — Eminent Clicks" },
      {
        property: "og:description",
        content: "Subscribe by bank transfer and your tools unlock the moment payment is approved.",
      },
    ],
  }),
  component: Dashboard,
});

type Payment = {
  id: string;
  tool_key: string;
  status: string;
  tracking_code: string;
};

function Dashboard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [active, setActive] = useState<Tool | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("admin") === "true") {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payments")
      .select("id, tool_key, status, tracking_code")
      .eq("user_id", user.id);
    setPayments(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live unlock: an admin approval flips the badge without a refresh.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const statusFor = (key: string) => {
    const rows = payments.filter((p) => p.tool_key === key);
    if (rows.some((p) => p.status === "Approved")) return "Approved";
    if (rows.some((p) => p.status === "Pending")) return "Pending";
    if (rows.some((p) => p.status === "Rejected")) return "Rejected";
    return "Locked";
  };

  const unlockedCount = TOOLS.filter((t) => statusFor(t.key) === "Approved").length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-24 h-80 w-80 rounded-full bg-mint/10 blur-3xl" />

      <div className="relative mx-auto max-w-[400px] px-5 pb-16 pt-6">
        <AppHeader unlockedCount={unlockedCount} />

        <h1 className="mt-8 text-[28px] font-semibold leading-[1.08]">
          One login. Pay once, unlock instantly.
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Signed in as {user?.email}
        </p>

        <div className="mt-8 flex items-end justify-between">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Your workspace
          </span>
          <span className="text-[12px] text-muted-foreground">5 tools</span>
        </div>

        <div className="mt-4 space-y-3">
          {TOOLS.map((tool) => {
            const status = statusFor(tool.key);
            const unlocked = status === "Approved";
            return (
              <div
                key={tool.key}
                className={
                  unlocked
                    ? "rounded-2xl bg-mint/10 p-4 ring-1 ring-mint/30"
                    : "locked-shutter rounded-2xl bg-card p-4 ring-1 ring-border"
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      unlocked
                        ? "grid size-10 place-items-center rounded-lg bg-mint/20 ring-1 ring-mint/30"
                        : "grid size-10 place-items-center rounded-lg bg-secondary ring-1 ring-border"
                    }
                  >
                    <span
                      className={
                        unlocked
                          ? "font-display text-sm font-semibold text-mint"
                          : "font-display text-sm font-semibold text-muted-foreground"
                      }
                    >
                      {tool.initials}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[17px] font-semibold">{tool.name}</span>
                      {unlocked ? (
                        <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-steel">
                          Unlocked
                        </span>
                      ) : status === "Pending" ? (
                        <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber ring-1 ring-amber/25">
                          Awaiting approval
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                          Locked — Subscribe to unlock
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground">{tool.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  {unlocked ? (
                    <span className="font-display text-base font-semibold text-mint">
                      Access is live
                    </span>
                  ) : (
                    <span className="font-display text-2xl font-semibold leading-none">
                      {naira(tool.price)}
                    </span>
                  )}
                  {unlocked ? (
                    <Link
                      to="/tools/$tool"
                      params={{ tool: tool.key }}
                      className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-steel"
                    >
                      Open
                    </Link>
                  ) : (
                    <button
                      onClick={() => setActive(tool)}
                      className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      {status === "Pending" ? "Send another receipt" : "Subscribe"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active && user && (
        <PaymentModal
          tool={active}
          userId={user.id}
          defaultEmail={user.email ?? ""}
          onClose={() => setActive(null)}
        />
      )}
    </main>
  );
}
