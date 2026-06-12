import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useMyWithdrawals, useRequestWithdrawal } from "@/lib/app-queries";
import { useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  ArrowDownToLine,
  History,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/app/withdraw")({
  component: WithdrawPage,
});

function WithdrawPage() {
  const { data: profile } = useProfile();
  const { data: withdrawals, isLoading: loadingHistory } = useMyWithdrawals();
  const request = useRequestWithdrawal();

  const [amount, setAmount] = useState("");
  const [showForm, setShowAdd] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.account_number) {
      toast.error("Please set up your Payout Details in Settings first.");
      return;
    }

    const amt = Number(amount);
    if (!amt || amt < 5) {
      toast.error("Minimum withdrawal is GH₵ 5");
      return;
    }

    try {
      await request.mutateAsync({
        amount: amt,
        bank_name: profile.bank_name || "MTN",
        account_number: profile.account_number,
        account_name: profile.account_name || profile.display_name
      });
      setAmount("");
      setShowAdd(false);
      toast.success("Withdrawal request sent!", {
        description: "Admin will process your payout within 24 hours."
      });
    } catch (e) {
      toast.error("Failed to submit request.");
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case 'rejected': return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <AppShell title="Withdraw Funds">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">

        {/* Main Payout Destination Card */}
        <Card className="bg-primary overflow-hidden border-none text-white relative">
          <div className="relative z-10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-primary-foreground/70 text-xs font-black uppercase tracking-widest mb-1">Active Payout Account</div>
              {profile?.account_number ? (
                <div className="space-y-1">
                  <div className="text-2xl font-display font-black flex items-center gap-2">
                    {profile.bank_name}: {profile.account_number}
                  </div>
                  <div className="text-sm font-medium opacity-80">{profile.account_name}</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-primary-foreground/90">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">Payout account not set</span>
                </div>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-2xl h-12 px-6"
            >
              <Link to="/app/settings">Update Details</Link>
            </Button>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 rotate-12" />
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Request Form */}
          <div className="lg:col-span-1">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              New Request
            </h3>
            <Card>
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Withdrawal Amount (GH₵)</Label>
                  <Input
                    type="number"
                    min="5"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="50"
                    className="h-12 text-xl font-black rounded-xl"
                    required
                  />
                </div>

                <div className="p-3 bg-muted/30 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Admin Fee</span>
                    <span className="font-bold">GH₵ 0.00</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                    <span className="font-bold">You will receive</span>
                    <span className="font-black text-primary">GH₵ {Number(amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                  disabled={request.isPending || !profile?.account_number}
                >
                  {request.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
                </Button>

                {!profile?.account_number && (
                  <p className="text-[10px] text-red-500 font-bold text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Set payout details first
                  </p>
                )}
              </form>
            </Card>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Request History
            </h3>
            {loadingHistory ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (withdrawals ?? []).length === 0 ? (
              <EmptyState title="No requests yet" hint="Your processed withdrawals will appear here." />
            ) : (
              <div className="grid gap-3">
                {withdrawals!.map(w => (
                  <Card key={w.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border",
                        getStatusStyle(w.status)
                      )}>
                        {getStatusIcon(w.status)}
                      </div>
                      <div>
                        <div className="font-black text-base leading-none mb-1">GH₵ {Number(w.amount).toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">
                          {format(new Date(w.created_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                        getStatusStyle(w.status)
                      )}>
                        {w.status}
                      </div>
                      {w.notes && <div className="text-[10px] text-muted-foreground italic mt-1 max-w-[150px] truncate">"{w.notes}"</div>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
