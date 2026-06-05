import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MomoFields, useMomo } from "@/components/momo-form";
import { useApplyForLoan, useClipScore, useMyLoans, useRecordRepayment } from "@/lib/app-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/loans")({
  component: Loans,
});

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted-foreground",
  approved: "text-primary",
  repaying: "text-primary",
  rejected: "text-destructive",
  closed: "text-muted-foreground",
};

function Loans() {
  const { score } = useClipScore();
  const list = useMyLoans();
  const apply = useApplyForLoan();
  const repay = useRecordRepayment();
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 600) * 20)));

  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("3");
  const [purpose, setPurpose] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (!a || a > maxLoan) { toast.error(`Amount must be 1 – ${maxLoan}`); return; }
    try {
      await apply.mutateAsync({ amount: a, term_months: Number(term), purpose });
      setAmount(""); setPurpose("");
      toast.success("Application submitted");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Loans">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="font-display font-semibold mb-1">Apply for a loan</h3>
          <p className="text-xs text-muted-foreground mb-3">Your ClipScore {score} qualifies you up to <span className="font-bold text-gold">GH₵ {maxLoan.toLocaleString()}</span>.</p>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Amount (GH₵)</Label><Input type="number" min="1" max={maxLoan} value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div>
              <Label>Term (months)</Label>
              <select value={term} onChange={(e) => setTerm(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="1">1</option><option value="3">3</option><option value="6">6</option><option value="12">12</option>
              </select>
            </div>
            <div><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. New clippers" required /></div>
            <Button type="submit" disabled={apply.isPending} className="w-full">
              {apply.isPending ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">My applications</h3>
          {(list.data ?? []).length === 0 ? (
            <EmptyState title="No applications yet" />
          ) : (
            <div className="space-y-3">
              {list.data!.map((l) => <LoanRow key={l.id} loan={l} repay={repay} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function LoanRow({ loan, repay }: { loan: { id: string; amount: number; term_months: number; purpose: string; status: string; balance: number; decision_note: string; created_at: string }; repay: ReturnType<typeof useRecordRepayment> }) {
  const [amount, setAmount] = useState("");
  const [momo, setMomo] = useMomo();
  const canRepay = loan.status === "approved" || loan.status === "repaying";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (!a || !momo.momo_reference) { toast.error("Amount and MoMo reference required"); return; }
    try {
      await repay.mutateAsync({ loan_id: loan.id, amount: a, ...momo });
      setAmount(""); setMomo({ ...momo, momo_reference: "" });
      toast.success("Repayment recorded");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display font-bold">GH₵ {Number(loan.amount).toLocaleString()} · {loan.term_months}mo</div>
          <div className="text-xs text-muted-foreground">{loan.purpose}</div>
          <div className={`text-xs font-bold uppercase mt-1 ${STATUS_COLOR[loan.status]}`}>{loan.status}</div>
          {loan.decision_note && <div className="text-xs mt-1 text-muted-foreground italic">Note: {loan.decision_note}</div>}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Balance</div>
          <div className="font-bold">GH₵ {Number(loan.balance).toLocaleString()}</div>
        </div>
      </div>

      {canRepay && (
        <form onSubmit={submit} className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Repayment amount (GH₵)</Label>
              <Input className="mt-1" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="sm:col-span-2"><MomoFields value={momo} onChange={setMomo} /></div>
          </div>
          <Button type="submit" size="sm" disabled={repay.isPending}>Record repayment</Button>
        </form>
      )}
    </Card>
  );
}
