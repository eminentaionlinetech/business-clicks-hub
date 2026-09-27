import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminIfNone } from "@/lib/admin.functions";
import { TOOLS, naira } from "@/lib/tools";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — Eminent Clicks" },
      { name: "description", content: "Review and approve Eminent Clicks payment receipts." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin review — Eminent Clicks" },
      { property: "og:description", content: "Internal payment approval queue." },
    ],
  }),
  component: AdminPage,
});

type Payment = {
  id: string;
  tool_key: string;
  tool_name: string;
  amount: number;
  email: string;
  whatsapp: string;
  receipt_path: string | null;
  receipt_url: string | null;
  tracking_code: string;
  status: string;
  created_at: string;
};

const TABS = ["All", "Pending", "Approved", "Rejected"] as const;

function AdminPage() {
  const { user } = useSession();
  const bootstrap = useServerFn(claimAdminIfNone);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [toolFilter, setToolFilter] = useState("all");
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    bootstrap({ data: undefined })
      .then((res) => setIsAdmin(res.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [user, bootstrap]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return;
    setRows((data ?? []) as Payment[]);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    const channel = supabase
      .channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () =>
        void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, load]);

  const setStatus = async (id: string, status: "Approved" | "Rejected") => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment ${status.toLowerCase()}`);
    void load();
  };

  const viewReceipt = async (row: Payment) => {
    if (!row.receipt_path) {
      toast.error("No receipt on file");
      return;
    }
    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(row.receipt_path, 3600);
    if (error || !data) {
      toast.error("Could not open receipt");
      return;
    }
    setZoom(data.signedUrl);
  };

  if (isAdmin === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking access…
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-center">
        <div>
          <h1 className="font-display text-xl font-semibold">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account isn't an administrator.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const filtered = rows.filter((r) => {
    if (tab !== "All" && r.status !== tab) return false;
    if (toolFilter !== "all" && r.tool_key !== toolFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.tracking_code.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.tool_name.toLowerCase().includes(q)
    );
  });

  const stats = [
    { label: "Total uploads", value: rows.length, tone: "text-foreground" },
    { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, tone: "text-amber" },
    { label: "Approved", value: rows.filter((r) => r.status === "Approved").length, tone: "text-mint" },
    {
      label: "Rejected",
      value: rows.filter((r) => r.status === "Rejected").length,
      tone: "text-destructive",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-3xl" />

      <div className="relative mx-auto max-w-[900px] px-5 pb-16 pt-6">
        <AppHeader />

        <h1 className="mt-8 text-[26px] font-semibold">Admin review</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Live queue — approvals unlock the customer's tool instantly.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-card p-3 ring-1 ring-border">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-semibold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracking code, email or tool"
          className="mt-4 w-full rounded-lg bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-amber"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "rounded-full bg-amber px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
              }
            >
              {t}
            </button>
          ))}
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="ml-auto rounded-full bg-card px-3 py-1.5 text-xs text-foreground ring-1 ring-border outline-none"
          >
            <option value="all">All tools</option>
            {TOOLS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
              No submissions yet.
            </p>
          )}
          {filtered.map((row) => (
            <div key={row.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="flex gap-3">
                <button
                  onClick={() => viewReceipt(row)}
                  className="size-16 shrink-0 overflow-hidden rounded-lg bg-secondary ring-1 ring-border"
                  aria-label="Enlarge receipt"
                >
                  {row.receipt_url ? (
                    <img
                      src={row.receipt_url}
                      alt="Receipt"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[9px] uppercase text-muted-foreground">
                      Receipt
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-semibold">{row.tool_name}</span>
                    <span className="font-display text-[15px] font-semibold text-amber">
                      {naira(row.amount)}
                    </span>
                    <span
                      className={
                        row.status === "Approved"
                          ? "rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold uppercase text-steel"
                          : row.status === "Rejected"
                            ? "rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground"
                            : "rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber ring-1 ring-amber/25"
                      }
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-muted-foreground">{row.email}</p>
                  <p className="text-[12px] text-muted-foreground">{row.whatsapp}</p>
                  <p className="mt-1 text-[12px]">
                    <span className="font-display font-semibold">{row.tracking_code}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {new Date(row.created_at).toLocaleString("en-NG")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => viewReceipt(row)}
                  className="rounded-md bg-secondary px-3 py-1.5 text-[12px] font-semibold text-foreground ring-1 ring-border"
                >
                  View Receipt
                </button>
                <button
                  onClick={() => setStatus(row.id, "Approved")}
                  className="rounded-md bg-mint px-3 py-1.5 text-[12px] font-semibold text-steel"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStatus(row.id, "Rejected")}
                  className="rounded-md bg-destructive px-3 py-1.5 text-[12px] font-semibold text-foreground"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-steel/90 p-4"
          onClick={() => setZoom(null)}
        >
          <img src={zoom} alt="Receipt" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </main>
  );
}
