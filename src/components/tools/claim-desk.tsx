import { useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { supabase } from "@/integrations/supabase/client";
import { useRows } from "@/lib/use-rows";
import { naira } from "@/lib/tools";

type Claim = {
  id: string;
  title: string;
  category: string;
  amount: number;
  claim_date: string;
  status: string;
  receipt_url: string | null;
  notes: string | null;
};

const STATUSES = ["Submitted", "Under Review", "Approved", "Paid", "Rejected"] as const;

export function ClaimDeskTool() {
  const { rows, insert, update, remove } = useRows<Claim>("claimdesk_claims");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const pick = async (selected: File | undefined) => {
    if (!selected) return;
    if (!/image\/(jpeg|jpg|png|webp)/.test(selected.type)) {
      toast.error("Choose a JPG or PNG image");
      return;
    }
    try {
      setFile(await compressImage(selected));
    } catch {
      setFile(selected);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;
    setBusy(true);
    try {
      let receipt_path: string | null = null;
      let receipt_url: string | null = null;
      const { data: auth } = await supabase.auth.getUser();
      if (file && auth.user) {
        const path = `${auth.user.id}/${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("claim-receipts")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        receipt_path = path;
        const { data: signed } = await supabase.storage
          .from("claim-receipts")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        receipt_url = signed?.signedUrl ?? null;
      }
      const ok = await insert({
        title,
        category,
        amount: Number(amount),
        claim_date: date,
        notes: notes || null,
        receipt_url,
      });
      if (ok) {
        setTitle("");
        setAmount("");
        setNotes("");
        setFile(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save claim");
    } finally {
      setBusy(false);
    }
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-amber/10 p-4 ring-1 ring-amber/25">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Total claimed
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-amber">{naira(total)}</p>
      </div>

      <form onSubmit={add} className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="font-display text-sm font-semibold">New claim</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Claim title"
            required
            className="col-span-2 rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border"
          >
            <option>Expense</option>
            <option>Insurance</option>
            <option>Reimbursement</option>
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
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            required
            className="rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => void pick(e.target.files?.[0])}
            className="w-full rounded-lg bg-secondary px-3 py-2 text-[12px] text-muted-foreground ring-1 ring-border file:mr-2 file:rounded-md file:border-0 file:bg-card file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-foreground"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="col-span-2 resize-none rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-amber"
          />
        </div>
        <button
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Submit claim"}
        </button>
      </form>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            No claims yet.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold">{r.title}</p>
                <p className="text-[12px] text-muted-foreground">
                  {r.category} · {new Date(r.claim_date).toLocaleDateString("en-NG")}
                </p>
                {r.notes && <p className="mt-1 text-[12px] text-muted-foreground">{r.notes}</p>}
              </div>
              <p className="font-display text-[15px] font-semibold text-amber">
                {naira(Number(r.amount))}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={r.status}
                onChange={(e) => void update(r.id, { status: e.target.value })}
                className="rounded-lg bg-secondary px-2 py-1.5 text-[12px] outline-none ring-1 ring-border"
                aria-label={`Status for ${r.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {r.receipt_url && (
                <button
                  onClick={() => setZoom(r.receipt_url)}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-[12px] font-semibold ring-1 ring-border"
                >
                  View receipt
                </button>
              )}
              <button
                onClick={() => void remove(r.id)}
                className="ml-auto rounded-lg bg-secondary px-3 py-1.5 text-[12px] text-muted-foreground ring-1 ring-border"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-steel/90 p-4"
          onClick={() => setZoom(null)}
        >
          <img src={zoom} alt="Claim receipt" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
