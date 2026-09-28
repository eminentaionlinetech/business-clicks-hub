import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRows } from "@/lib/use-rows";
import { naira } from "@/lib/tools";

type Entry = {
  id: string;
  entry_date: string;
  kind: string;
  category: string;
  amount: number;
  note: string | null;
};

export function ReportSnapTool() {
  const { rows, insert, remove } = useRows<Entry>("reportsnap_entries", "entry_date");
  const [kind, setKind] = useState("sale");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const sales = useMemo(
    () => rows.filter((r) => r.kind === "sale").reduce((s, r) => s + Number(r.amount), 0),
    [rows],
  );
  const expenses = useMemo(
    () => rows.filter((r) => r.kind === "expense").reduce((s, r) => s + Number(r.amount), 0),
    [rows],
  );
  const profit = sales - expenses;

  const chartData = useMemo(() => {
    const map = new Map<string, { day: string; Sales: number; Expenses: number }>();
    for (const r of rows) {
      const day = r.entry_date;
      const cur = map.get(day) ?? { day, Sales: 0, Expenses: 0 };
      if (r.kind === "sale") cur.Sales += Number(r.amount);
      else cur.Expenses += Number(r.amount);
      map.set(day, cur);
    }
    return [...map.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-14);
  }, [rows]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + Number(r.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const ok = await insert({ entry_date: date, kind, category, amount: Number(amount), note: note || null });
    if (ok) {
      setAmount("");
      setNote("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-mint/10 p-3 ring-1 ring-mint/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sales</p>
          <p className="mt-1 font-display text-[15px] font-semibold text-mint">{naira(sales)}</p>
        </div>
        <div className="rounded-xl bg-amber/10 p-3 ring-1 ring-amber/25">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</p>
          <p className="mt-1 font-display text-[15px] font-semibold text-amber">{naira(expenses)}</p>
        </div>
        <div
          className={
            profit >= 0
              ? "rounded-xl bg-mint/10 p-3 ring-1 ring-mint/30"
              : "rounded-xl bg-rose/15 p-3 ring-1 ring-rose/30"
          }
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Profit</p>
          <p
            className={`mt-1 font-display text-[15px] font-semibold ${profit >= 0 ? "text-mint" : "text-rose"}`}
          >
            {naira(profit)}
          </p>
        </div>
      </div>

      <form onSubmit={add} className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-display text-sm font-semibold">Add entry</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border"
          >
            <option value="sale">Sale</option>
            <option value="expense">Expense</option>
          </select>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="Amount ₦"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
        </div>
        <button className="mt-3 w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-primary-foreground">
          Save entry
        </button>
      </form>

      {chartData.length > 0 && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Sales vs expenses (last 14 days)
          </p>
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--steel-4)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "var(--ice-dim)" }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 9, fill: "var(--ice-dim)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--steel-2)",
                    border: "1px solid var(--steel-4)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Sales" fill="var(--mint)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="var(--amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {byCategory.length > 0 && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Top categories (sales + expenses)
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
            No entries yet.
          </p>
        )}
        {[...rows].reverse().slice(0, 30).map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            <span
              className={
                r.kind === "sale"
                  ? "rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-mint"
                  : "rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber"
              }
            >
              {r.kind}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{r.category}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(r.entry_date).toLocaleDateString("en-NG")}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <p
              className={`font-display text-[14px] font-semibold ${r.kind === "sale" ? "text-mint" : "text-amber"}`}
            >
              {r.kind === "sale" ? "+" : "−"}
              {naira(Number(r.amount))}
            </p>
            <button
              onClick={() => void remove(r.id)}
              aria-label="Delete entry"
              className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground ring-1 ring-border"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
