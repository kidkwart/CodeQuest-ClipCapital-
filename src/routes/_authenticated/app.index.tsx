import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Card, EmptyState } from "@/components/app-shell";
import { ClipScoreGauge } from "@/components/clip-score-gauge";
import { useClipScore, useIncome, useExpenses, useMyLoans, useAddIncome } from "@/lib/app-queries";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { score } = useClipScore();
  const income = useIncome();
  const expenses = useExpenses();
  const loans = useMyLoans();
  const addIncome = useAddIncome();

  const [customAmount, setCustomAmount] = useState("");
  const [activeQuickLog, setActiveQuickLog] = useState<number | null>(null);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthIncome = (income.data ?? []).filter((e) => new Date(e.entry_date) >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const monthExpense = (expenses.data ?? []).filter((e) => new Date(e.entry_date) >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const profit = monthIncome - monthExpense;
  const outstanding = (loans.data ?? []).filter((l) => l.status === "approved" || l.status === "repaying")
    .reduce((s, l) => s + Number(l.balance), 0);
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 600) * 20)));

  const quickLog = async (amt: number) => {
    setActiveQuickLog(amt);
    try {
      await addIncome.mutateAsync({
        amount: amt,
        note: "Quick log",
        entry_date: new Date().toISOString().split('T')[0]
      });
      toast.success(`GH₵ ${amt} logged!`);
    } catch (e) {
      console.error("Log error:", e);
      toast.error("Failed to save. Check your connection.");
    } finally {
      setActiveQuickLog(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt <= 0) return;
    await quickLog(amt);
    setCustomAmount("");
  };

  return (
    <AppShell title="Dashboard">
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 flex flex-col items-center">
          <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-4">Your Credit Identity</div>
          <ClipScoreGauge score={score} size={220} />
          <div className="text-xs text-muted-foreground mt-4 text-center bg-gold/10 p-2 rounded-lg border border-gold/20">
            Current Loan Limit: <span className="text-gold font-bold">GH₵ {maxLoan.toLocaleString()}</span>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard label="Income this month" value={`GH₵ ${monthIncome.toLocaleString()}`} hint={`${(income.data ?? []).length} entries total`} />
            <StatCard label="Expenses this month" value={`GH₵ ${monthExpense.toLocaleString()}`} />
            <StatCard label="Profit this month" value={`GH₵ ${profit.toLocaleString()}`} hint={profit >= 0 ? "In the green" : "Spend > earn"} />
            <StatCard label="Loan outstanding" value={`GH₵ ${outstanding.toLocaleString()}`} hint={`${(loans.data ?? []).length} application(s)`} />
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <h3 className="font-display font-bold text-sm uppercase tracking-tight">Quick Log Income</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[10, 20, 50, 100].map((amt) => (
                <motion.div key={amt} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="w-full h-12 font-bold border-primary/20 bg-background hover:bg-primary hover:text-white transition-all relative overflow-hidden"
                    onClick={() => quickLog(amt)}
                    disabled={addIncome.isPending}
                  >
                    {activeQuickLog === amt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `GH₵ ${amt}`
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom amount..."
                className="h-10 bg-background"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <Button type="submit" size="sm" className="px-4" disabled={addIncome.isPending || !customAmount}>
                {addIncome.isPending && !activeQuickLog ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Log
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Activity
          </h2>
          {income.isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (income.data ?? []).length === 0 ? (
            <EmptyState title="No activity yet" hint="Start logging your daily income to build your ClipScore." />
          ) : (
            <Card className="p-0 overflow-hidden">
              <ul className="divide-y divide-border text-sm">
                {(income.data ?? []).slice(0, 8).map((i) => (
                  <li key={i.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Income Entry</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{new Date(i.entry_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-primary">+ GH₵ {Number(i.amount).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{i.note}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {income.data && income.data.length > 8 && (
                <Link to="/app/income" className="block p-3 text-center text-xs font-bold text-primary hover:bg-primary/5 border-t border-border">
                  View all history →
                </Link>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="font-display font-semibold mb-4">Quick actions</h2>
          <div className="grid gap-3">
            {[
              ["Detailed Income", "/app/income", TrendingUp],
              ["Manage Expenses", "/app/expenses", Receipt],
              ["Credit & Loans", "/app/loans", Wallet],
              ["ClipMarket Shop", "/app/market", Store],
            ].map(([label, to, Icon]) => (
              <Link key={to} to={to as string} className="flex items-center justify-between rounded-xl bg-surface border border-border hover:border-primary/50 p-4 transition shadow-sm hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                  </div>
                  <div className="font-semibold text-sm">{label}</div>
                </div>
                <div className="text-muted-foreground group-hover:text-primary transition-colors">→</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
