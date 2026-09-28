import { useMemo, useState } from "react";
import { useRows } from "@/lib/use-rows";
import { naira } from "@/lib/tools";

type Invoice = {
  id: string;
  client_name: string;
  description: string | null;
  amount: number;
  amount_paid: number;
  due_date: string;
};

export function PayChaserTool() {
  const { rows, insert, update } = useRows<Invoice>("paychaser_invoices");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  const outstanding = (r: Invoice) => Number(r.amount) - Number(r.amount_paid);
  const isOverdue = (r: Invoice) => outstanding(r) > 0 && new Date(r.due_date) < new Date(new Date().toDateString());

  const unpaidTotal = useMemo(
    () => rows.reduce((s, r) => s + Math.max(outstanding(r), 0), 0),
    [rows],
  );
  const overdueTotal = useMemo(
    () => rows.filter(isOverdue).reduce((s, r) => s + outstanding(r), 0),
    [rows],
  );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !amount || !due) return;
    const ok = await insert({
      client_name: client,
      description: description || null,
      amount: Number(amount),
      due_date: due,
    });
    if (ok) {
      setClient("");
      setDescription("");
      setAmount("");
      setDue("");
    }
  };

  const remind = (r: Invoice) => {
    const text = encodeURIComponent(
      `Hello ${r.client_name}, gentle reminder that ₦${outstanding(r).toLocaleString("en-NG")} is outstanding on your invoice${r.description ? ` (${r.description})` : ""}, due ${new Date(r.due_date).toLocaleDateString("en-NG")}. Thank you!`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-amber/10 p-4 ring-1 ring-amber/25">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Unpaid total</p>
          <p className="mt-1 font-display text-xl font-semibold text-amber">{naira(unpaidTotal)}</p>
        </div>
        <div className="rounded-2xl bg-rose/15 p-4 ring-1 ring-rose/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Overdue total</p>
          <p className="mt-1 font-display text-xl font-semibold text-rose">{naira(overdueTotal)}</p>
        </div>
      </div>

      <form onSubmit={add} className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-display text-sm font-semibold">Add invoice</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Client name"
            required
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
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
            value={due}
            onChange={(e) => setDue(e.target.value)}
            type="date"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
        </div>
        <button className="mt-3 w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-primary-foreground">
          Save invoice
        </button>
      </form>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            No invoices yet.
          </p>
        )}
        {rows.map((r) => {
          const out = outstanding(r);
          const overdue = isOverdue(r);
          return (
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold">{r.client_name}</p>
                  {r.description && (
                    <p className="text-[12px] text-muted-foreground">{r.description}</p>
                  )}
                  <p className="text-[12px] text-muted-foreground">
                    Due {new Date(r.due_date).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[15px] font-semibold">{naira(Number(r.amount))}</p>
                  <p className={out > 0 ? "text-[12px] text-amber" : "text-[12px] text-mint"}>
                    {out > 0 ? `${naira(out)} outstanding` : "Fully paid"}
                  </p>
                </div>
              </div>
              {overdue && (
                <span className="mt-2 inline-block rounded-full bg-rose/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose">
                  Overdue
                </span>
              )}
              {out > 0 && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => remind(r)}
                    className="flex-1 rounded-lg bg-amber py-2 text-[12px] font-semibold text-primary-foreground"
                  >
                    Send reminder
                  </button>
                  <button
                    onClick={() => void update(r.id, { amount_paid: Number(r.amount) })}
                    className="rounded-lg bg-mint px-3 py-2 text-[12px] font-semibold text-steel"
                  >
                    Mark paid
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
