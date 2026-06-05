import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Card, EmptyState } from "@/components/app-shell";
import { ClipScoreGauge } from "@/components/clip-score-gauge";
import { useClipScore, useIncome, useExpenses, useMyLoans, useAddIncome, useRevenueGoal, useUpdateRevenueGoal } from "@/lib/app-queries";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Zap, Loader2, Target, Trophy, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { score } = useClipScore();
  const income = useIncome();
  const expenses = useExpenses();
  const loans = useMyLoans();
  const addIncome = useAddIncome();
  const { data: goal } = useRevenueGoal();
  const updateGoal = useUpdateRevenueGoal();

  const [customAmount, setCustomAmount] = useState("");
  const [activeQuickLog, setActiveQuickLog] = useState<number | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthIncome = (income.data ?? []).filter((e) => new Date(e.entry_date) >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const monthExpense = (expenses.data ?? []).filter((e) => new Date(e.entry_date) >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const profit = monthIncome - monthExpense;
  const outstanding = (loans.data ?? []).filter((l) => l.status === "approved" || l.status === "repaying")
    .reduce((s, l) => s + Number(l.balance), 0);
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 100) * 8)));

  const goalAmount = goal?.monthly_target || 1000;
  const progressPercent = Math.min(100, Math.round((monthIncome / goalAmount) * 100));

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

  const handleGoalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newGoal);
    if (isNaN(val) || val <= 0) return;
    try {
      await updateGoal.mutateAsync(val);
      setIsEditingGoal(false);
      toast.success("Revenue goal updated!");
    } catch (e) { toast.error("Failed to update goal"); }
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Loan Disbursed Notification Bar */}
        <AnimatePresence>
          {loans.data?.some(l => l.status === 'approved' && !l.disbursed_at) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider">Loan Disbursed!</div>
                  <div className="text-[10px] opacity-90 font-medium">Your funds have been sent to your MoMo. Check your wallet.</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8 text-[10px] font-black uppercase">
                Got it
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col items-center">
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-4">Your Credit Identity</div>
            <ClipScoreGauge score={score} size={220} />
            <div className="text-xs text-muted-foreground mt-4 text-center bg-gold/10 p-3 rounded-xl border border-gold/20 w-full">
              Current Loan Limit: <span className="text-gold font-black">GH₵ {maxLoan.toLocaleString()}</span>
            </div>
          </Card>

          {/* Monthly Revenue Goal Card */}
          <Card className="bg-primary/5 border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Monthly Goal</span>
              </div>
              <button
                onClick={() => { setIsEditingGoal(!isEditingGoal); setNewGoal(String(goalAmount)); }}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {isEditingGoal ? "Cancel" : "Set Goal"}
              </button>
            </div>

            {isEditingGoal ? (
              <form onSubmit={handleGoalUpdate} className="flex gap-2 mb-4">
                <Input
                  type="number"
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  className="h-9 text-xs font-bold"
                  autoFocus
                />
                <Button size="sm" className="h-9 px-3 text-[10px] font-bold" disabled={updateGoal.isPending}>Save</Button>
              </form>
            ) : (
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1.5">
                  <div className="text-2xl font-display font-black text-primary">GH₵ {monthIncome.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-muted-foreground">Target: GH₵ {goalAmount.toLocaleString()}</div>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">{progressPercent}% Achieved</span>
                  {progressPercent >= 100 && (
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> GOAL SMASHED!
                    </span>
                  )}
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Consistently meeting your revenue goals increases your ClipScore eligibility faster.
            </p>
          </Card>
        </div>

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
              <h3 className="font-display font-bold text-sm uppercase tracking-tight">Turbo Log Income</h3>
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
                className="h-10 bg-background font-bold"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <Button type="submit" size="sm" className="px-4 font-bold" disabled={addIncome.isPending || !customAmount}>
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
              ["Manage Expenses", "/app/expenses", TrendingUp],
              ["Credit & Loans", "/app/loans", TrendingUp],
              ["ClipMarket Shop", "/app/market", TrendingUp],
            ].map(([label, to]) => (
              <Link key={to} to={to as string} className="flex items-center justify-between rounded-xl bg-surface border border-border hover:border-primary/50 p-4 transition shadow-sm hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
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
