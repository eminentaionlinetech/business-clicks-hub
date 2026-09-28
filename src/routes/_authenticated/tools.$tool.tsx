import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PaymentModal } from "@/components/payment-modal";
import { ClaimDeskTool } from "@/components/tools/claim-desk";
import { JobFlowTool } from "@/components/tools/job-flow";
import { PayChaserTool } from "@/components/tools/pay-chaser";
import { ReportSnapTool } from "@/components/tools/report-snap";
import { SubTrackTool } from "@/components/tools/sub-track";
import { supabase } from "@/integrations/supabase/client";
import { TOOLS, getTool, naira } from "@/lib/tools";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/tools/$tool")({
  head: ({ params }) => {
    const tool = getTool(params.tool);
    return {
      meta: [
        { title: `${tool?.name ?? "Tool"} — Eminent Clicks` },
        { name: "description", content: tool?.tagline ?? "Eminent Clicks business tool." },
        { property: "og:title", content: `${tool?.name ?? "Tool"} — Eminent Clicks` },
        { property: "og:description", content: tool?.tagline ?? "Eminent Clicks business tool." },
      ],
    };
  },
  component: ToolPage,
});

function ToolPage() {
  const { tool: toolKey } = Route.useParams();
  const navigate = useNavigate();
  const tool = getTool(toolKey);
  const { user } = useSession();
  const [status, setStatus] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const load = useCallback(async () => {
    if (!user || !tool) return;
    const { data } = await supabase
      .from("payments")
      .select("status")
      .eq("user_id", user.id)
      .eq("tool_key", tool.key);
    const rows = data ?? [];
    setStatus(
      rows.some((r) => r.status === "Approved")
        ? "Approved"
        : rows.some((r) => r.status === "Pending")
          ? "Pending"
          : "Locked",
    );
  }, [user, tool]);

  useEffect(() => {
    void load();
    if (!user || !tool) return;
    const channel = supabase
      .channel(`tool-${tool.key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, tool, load]);

  if (!tool) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="font-display text-xl font-semibold">Tool not found</h1>
          <Link to="/dashboard" className="mt-4 inline-block text-sm text-amber underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (status === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Opening {tool.name}…
      </main>
    );
  }

  if (status !== "Approved") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-3xl" />
        <div className="relative mx-auto max-w-[400px] px-5 pb-16 pt-6">
          <AppHeader />
          <div className="locked-shutter mt-10 rounded-2xl bg-card p-6 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary ring-1 ring-border">
                <span className="font-display text-sm font-semibold text-muted-foreground">
                  {tool.initials}
                </span>
              </span>
              <div>
                <span className="font-display text-[17px] font-semibold">{tool.name}</span>
                <p className="text-[13px] text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>
            {status === "Pending" ? (
              <p className="mt-5 rounded-lg bg-amber/10 p-3 text-[13px] text-amber ring-1 ring-amber/25">
                Receipt received — awaiting admin approval. {tool.name} unlocks automatically the
                moment it's approved.
              </p>
            ) : null}
            <p className="mt-5 font-display text-2xl font-semibold text-amber">{naira(tool.price)}</p>
            <button
              onClick={() => setSubscribing(true)}
              className="mt-3 w-full rounded-lg bg-amber py-3 text-sm font-semibold text-primary-foreground"
            >
              {status === "Pending" ? "Send another receipt" : "Subscribe to unlock"}
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="mt-2 w-full rounded-lg bg-secondary py-3 text-sm font-semibold text-foreground ring-1 ring-border"
            >
              Back to dashboard
            </button>
          </div>
        </div>
        {subscribing && user && (
          <PaymentModal
            tool={tool}
            userId={user.id}
            defaultEmail={user.email ?? ""}
            onClose={() => {
              setSubscribing(false);
              void load();
            }}
          />
        )}
      </main>
    );
  }

  const tools = TOOLS;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
      <div className="relative mx-auto max-w-[420px] px-5 pb-16 pt-6">
        <AppHeader />
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-mint/20 ring-1 ring-mint/30">
              <span className="font-display text-sm font-semibold text-mint">{tool.initials}</span>
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold">{tool.name}</h1>
              <p className="text-[12px] text-mint">Unlocked</p>
            </div>
          </div>
          <select
            value={tool.key}
            onChange={(e) => navigate({ to: "/tools/$tool", params: { tool: e.target.value } })}
            className="rounded-full bg-card px-3 py-1.5 text-xs text-foreground ring-1 ring-border outline-none"
            aria-label="Switch tool"
          >
            {tools.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          {tool.key === "subtrack" && <SubTrackTool />}
          {tool.key === "jobflow" && <JobFlowTool />}
          {tool.key === "paychaser" && <PayChaserTool />}
          {tool.key === "reportsnap" && <ReportSnapTool />}
          {tool.key === "claimdesk" && <ClaimDeskTool />}
        </div>
      </div>
    </main>
  );
}
