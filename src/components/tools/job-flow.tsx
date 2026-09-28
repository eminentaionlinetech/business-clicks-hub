import { useState } from "react";
import { useRows } from "@/lib/use-rows";
import { naira } from "@/lib/tools";

type Job = {
  id: string;
  title: string;
  client_name: string;
  client_phone: string | null;
  status: string;
  amount: number;
  notes: string | null;
};

const STATUSES = ["New", "Quoted", "Scheduled", "In Progress", "Completed", "Invoiced"] as const;

const statusStyle = (status: string) =>
  status === "Invoiced"
    ? "bg-mint px-2 py-0.5 text-[10px] font-semibold uppercase text-steel"
    : status === "In Progress"
      ? "bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber ring-1 ring-amber/25"
      : "bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground ring-1 ring-border";

export function JobFlowTool() {
  const { rows, insert, update } = useRows<Job>("jobflow_jobs");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client) return;
    const ok = await insert({
      title,
      client_name: client,
      client_phone: phone || null,
      amount: Number(amount) || 0,
      status: "New",
    });
    if (ok) {
      setTitle("");
      setClient("");
      setPhone("");
      setAmount("");
    }
  };

  const saveNote = async (id: string, notes: string) => {
    await update(id, { notes });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-display text-sm font-semibold">Add job</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            required
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Client name"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Client phone"
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="Amount ₦"
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
        </div>
        <button className="mt-3 w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-primary-foreground">
          Save job
        </button>
      </form>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            No jobs yet.
          </p>
        )}
        {rows.map((job) => (
          <div key={job.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold">{job.title}</p>
                <p className="text-[12px] text-muted-foreground">{job.client_name}</p>
                {job.client_phone && (
                  <a
                    href={`https://wa.me/${job.client_phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-amber underline"
                  >
                    {job.client_phone}
                  </a>
                )}
              </div>
              <span className="font-display text-[15px] font-semibold text-amber">
                {naira(Number(job.amount))}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                value={job.status}
                onChange={(e) => void update(job.id, { status: e.target.value })}
                className="rounded-lg bg-secondary px-2 py-1.5 text-[12px] outline-none ring-1 ring-border"
                aria-label={`Status for ${job.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span className={`rounded-full ${statusStyle(job.status)}`}>{job.status}</span>
            </div>

            <textarea
              defaultValue={job.notes ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (job.notes ?? "")) void saveNote(job.id, e.target.value);
              }}
              placeholder="Notes — tap away to save"
              rows={2}
              className="mt-3 w-full resize-none rounded-lg bg-secondary px-3 py-2 text-[13px] outline-none ring-1 ring-border focus:ring-amber"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
