import { useMemo, useState } from "react";
import { useRows } from "@/lib/use-rows";
import { naira } from "@/lib/tools";

type Sub = {
  id: string;
  name: string;
  category: string;
  amount: number;
  cycle: string;
  renewal_date: string;
};

const CYCLES = ["Monthly", "Quarterly", "Yearly"] as const;
const CATEGORIES = ["General", "Software", "Internet & Data", "Utilities", "Marketing", "Other"];

/** How much one unit of a cycle costs per month. */
const perMonth = (amount: number, cycle: string) =>
  cycle === "Yearly" ? amount / 12 : cycle === "Quarterly" ? amount / 3 : amount;

export function SubTrackTool() {
  const { rows, insert, remove } = useRows<Sub>("subtrack_items");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<string>("Monthly");
  const [renewal, setRenewal] = useState("");

  const monthlyTotal = useMemo(
    () => rows.reduce((sum, r) => sum + perMonth(Number(r.amount), r.cycle), 0),
    [rows],
  );
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + perMonth(Number(r.amount), r.cycle));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const daysLeft = (date: string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !renewal) return;
    const ok = await insert({
      name,
      category,
      amount: Number(amount),
      cycle,
      renewal_date: renewal,
    });
    if (ok) {
      setName("");
      setAmount("");
      setRenewal("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-mint/10 p-4 ring-1 ring-mint/30">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Monthly total (auto)
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-mint">
          {naira(monthlyTotal)}
        </p>
      </div>

      <form onSubmit={add} className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-display text-sm font-semibold">Add subscription</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Canva)"
            required
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="Amount ₦"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border"
          >
            {CYCLES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={renewal}
            onChange={(e) => setRenewal(e.target.value)}
            type="date"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
        </div>
        <button className="mt-3 w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-primary-foreground">
          Save subscription
        </button>
      </form>

      {byCategory.length > 0 && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            By category (monthly)
          </p>
          <div className="mt-2 space-y-1.5">
            {byCategory.map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-[13px]">
                <span>{cat}</span>
                <span className="font-display font-semibold">{naira(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            No subscriptions yet.
          </p>
        )}
        {rows.map((r) => {
          const days = daysLeft(r.renewal_date);
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{r.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {r.category} · {r.cycle} · renews{" "}
                  {new Date(r.renewal_date).toLocaleDateString("en-NG")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[14px] font-semibold text-amber">
                  {naira(Number(r.amount))}
                </p>
                <p
                  className={
                    days < 0
                      ? "text-[11px] font-semibold text-rose"
                      : days <= 7
                        ? "text-[11px] font-semibold text-amber"
                        : "text-[11px] text-muted-foreground"
                  }
                >
                  {days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d left`}
                </p>
              </div>
              <button
                onClick={() => void remove(r.id)}
                aria-label={`Delete ${r.name}`}
                className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-border"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
