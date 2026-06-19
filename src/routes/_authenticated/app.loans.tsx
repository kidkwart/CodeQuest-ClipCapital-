import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplyForLoan, useClipScore, useMyLoans, useRecordRepayment } from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { LoanCalculator } from "@/components/loan-calculator";
import { Smartphone, History, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePaystack } from "@/lib/paystack";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/loans")({
  component: Loans,
});

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  pending: { color: "text-orange-500 bg-orange-500/10", icon: Clock },
  approved: { color: "text-primary bg-primary/10", icon: CheckCircle2 },
  repaying: { color: "text-primary bg-primary/10", icon: History },
  rejected: { color: "text-red-500 bg-red-500/10", icon: AlertCircle },
  closed: { color: "text-muted-foreground bg-muted", icon: CheckCircle2 },
};

function Loans() {
  const { score } = useClipScore();
  const list = useMyLoans();
  const apply = useApplyForLoan();
  const repay = useRecordRepayment();
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 100) * 8)));

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
      toast.success("Application submitted successfully!");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Loans & Credit">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <h3 className="font-display font-bold text-lg mb-1">New Application</h3>
            <p className="text-xs text-muted-foreground mb-4">Your current limit: <span className="font-black text-gold">GH₵ {maxLoan.toLocaleString()}</span>.</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Requested Amount (GH₵)</Label>
                <Input type="number" min="1" max={maxLoan} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg font-bold rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Repayment Term</Label>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none">
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Loan Purpose</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Shop renovation, Stock clippers" className="h-12 rounded-xl bg-background" required />
              </div>
              <Button type="submit" disabled={apply.isPending} className="w-full h-12 font-bold shadow-lg shadow-primary/20 rounded-xl">
                {apply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
              </Button>
            </form>
          </Card>

          <LoanCalculator maxAmount={maxLoan} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Loan History
          </h3>
          {(list.data ?? []).length === 0 ? (
            <EmptyState title="No active loans" hint="Your approved applications will appear here." />
          ) : (
            <div className="space-y-4">
              {list.data!.map((l) => <LoanRow key={l.id} loan={l} repay={repay} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function LoanRow({ loan, repay }: { loan: { id: string; amount: number; term_months: number; purpose: string; status: string; balance: number; decision_note: string; created_at: string }; repay: ReturnType<typeof useRecordRepayment> }) {
  const { user } = useCurrentUser();
  const { initializePayment } = usePaystack();
  const [repayAmount, setRepayAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const canRepay = loan.status === "approved" || loan.status === "repaying";
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  async function handleRepay(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(repayAmount);
    if (!amt) { toast.error("Amount required"); return; }
    if (!user?.email) return;

    initializePayment({
      email: user.email,
      amount: amt,
      metadata: {
        payment_type: "loan_repayment",
        loan_id: loan.id,
        user_id: user.id,
        custom_fields: [
          { display_name: "Service", variable_name: "service", value: "Loan Repayment" },
          { display_name: "Loan Purpose", variable_name: "loan_purpose", value: loan.purpose }
        ]
      },
      onSuccess: async (reference) => {
        try {
          await repay.mutateAsync({
            loan_id: loan.id,
            amount: amt,
            momo_provider: "paystack",
            momo_reference: reference,
            status: "confirmed"
          });
          setRepayAmount("");
          setIsOpen(false);
          toast.success("Repayment successful! Balance updated.");
        } catch (err) {
          toast.error("Payment received but failed to update balance. Please contact Support with Ref: " + reference);
        }
      },
      onClose: () => {
        toast.error("Payment window closed.");
      }
    });
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", config.color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-display font-black text-foreground">GH₵ {Number(loan.amount).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-medium">{loan.purpose} • {loan.term_months} Months</div>
            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-1", config.color)}>
              {loan.status}
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Outstanding</div>
            <div className={cn("text-lg font-black", Number(loan.balance) > 0 ? "text-red-600" : "text-emerald-600")}>
              GH₵ {Number(loan.balance).toLocaleString()}
            </div>
          </div>
          {canRepay && Number(loan.balance) > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full h-8 px-4 font-bold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all gap-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              Pay Now {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-dashed border-border space-y-5">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-emerald-700">Real-time MoMo</div>
                  <p className="text-[10px] text-emerald-600 font-medium">Pay via Paystack to instantly reduce your loan balance.</p>
                </div>
              </div>

              <form onSubmit={handleRepay} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Amount to Repay (GH₵)</Label>
                  <Input
                    type="number"
                    max={loan.balance}
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="h-12 rounded-xl bg-muted/30 border-border/50 text-lg font-bold"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12 font-black shadow-lg shadow-emerald-500/10 rounded-xl" disabled={repay.isPending}>
                  {repay.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify & Pay with MoMo"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
