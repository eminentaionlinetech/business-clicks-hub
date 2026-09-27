import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, formatBytes } from "@/lib/compress-image";
import { BANK, naira, makeTrackingCode, type Tool } from "@/lib/tools";

type Props = {
  tool: Tool;
  userId: string;
  defaultEmail: string;
  onClose: () => void;
};

export function PaymentModal({ tool, userId, defaultEmail, onClose }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [whatsapp, setWhatsapp] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [compressed, setCompressed] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const pickFile = async (selected: File | undefined) => {
    if (!selected) return;
    if (!/image\/(jpeg|jpg|png|webp)/.test(selected.type)) {
      toast.error("Please choose a JPG or PNG image");
      return;
    }
    setFile(selected);
    setCompressed(null);
    try {
      const out = await compressImage(selected);
      setCompressed(out);
    } catch {
      setCompressed(selected);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const upload = compressed ?? file;
    if (!upload) {
      toast.error("Upload your transfer receipt");
      return;
    }
    setBusy(true);
    setProgress(4);

    // Smooth progress while the upload runs (finishes in ~2-3s).
    const ticker = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(1, Math.round((95 - p) / 9)) : p));
    }, 110);

    try {
      const tracking = makeTrackingCode();
      const path = `${userId}/${tracking}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, upload, { contentType: upload.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: signed } = await supabase.storage
        .from("receipts")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const { error: insertError } = await supabase.from("payments").insert({
        user_id: userId,
        tool_key: tool.key,
        tool_name: tool.name,
        amount: tool.price,
        email,
        whatsapp,
        receipt_path: path,
        receipt_url: signed?.signedUrl ?? null,
        tracking_code: tracking,
        status: "Pending",
      });
      if (insertError) throw insertError;

      setProgress(100);
      setCode(tracking);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-steel/70 backdrop-blur-sm sm:items-center">
      <div className="glass-panel w-full max-w-[420px] rounded-t-3xl p-5 pb-8 ring-1 ring-border sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Payment · {tool.name}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-amber">
              {naira(tool.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border"
          >
            ✕
          </button>
        </div>

        {code ? (
          <div className="mt-5 rounded-2xl bg-mint/10 p-4 ring-1 ring-mint/30">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-mint text-[13px] font-bold text-steel">
                ✓
              </span>
              <span className="font-display text-[15px] font-semibold text-mint">
                Receipt Uploaded! Awaiting Admin Approval
              </span>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Keep this tracking code. {tool.name} unlocks on your dashboard the moment an admin
              approves.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-background px-3 py-2.5">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Tracking code
              </span>
              <span className="font-display text-[14px] font-semibold">{code}</span>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-mint py-3 text-sm font-semibold text-steel"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mt-4 rounded-xl bg-background p-4 ring-1 ring-amber/25">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber">
                Bank transfer details
              </p>
              <div className="mt-3 grid grid-cols-2 gap-y-2 text-[13px]">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="text-right font-medium">{BANK.bankName}</span>
                <span className="text-muted-foreground">Account Number</span>
                <span className="text-right font-medium">{BANK.accountNumber}</span>
                <span className="text-muted-foreground">Account Name</span>
                <span className="text-right font-medium">{BANK.accountName}</span>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
                Transfer {naira(tool.price)} and upload receipt. One login. Pay once, unlock
                instantly.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-amber"
                  placeholder="you@business.ng"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-card px-3 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-amber"
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Choose File * (JPG or PNG)
                </label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  className="mt-1 w-full rounded-lg bg-card px-3 py-2.5 text-sm text-muted-foreground ring-1 ring-border file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
                />
              </div>
            </div>

            {file && (
              <div className="mt-3 rounded-lg bg-card p-3 ring-1 ring-border">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    {busy || progress > 0 ? `Uploading… ${progress}%` : "Ready"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-steel-4">
                  <div
                    className="h-full rounded-full bg-mint transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {formatBytes(file.size)}
                  {compressed && compressed.size < file.size
                    ? ` → ${formatBytes(compressed.size)} compressed`
                    : " · compressing…"}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-amber py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Uploading…" : "I've paid — upload receipt"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
