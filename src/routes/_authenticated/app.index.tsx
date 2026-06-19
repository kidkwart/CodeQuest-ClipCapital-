import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Card, EmptyState } from "@/components/app-shell";
import { ClipScoreGauge } from "@/components/clip-score-gauge";
import { useClipScore, useIncome, useExpenses, useMyLoans, useAddIncome, useRecentActivity, useProfile } from "@/lib/app-queries";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Zap, Loader2, ArrowUpRight, ArrowDownLeft, Wallet, ShoppingBag, PieChart, CheckCircle2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const profile = useProfile();
  const { score } = useClipScore();
  const income = useIncome();
  const expenses = useExpenses();
  const loans = useMyLoans();
  const addIncome = useAddIncome();
  const activity = useRecentActivity(8);

  const [incomeNote, setIncomeNote] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [activeQuickLog, setActiveQuickLog] = useState<number | null>(null);

  // Profile completion calculation
  const getCompletion = () => {
    if (!profile.data) return 0;
    const fields = [
      profile.data.display_name,
      profile.data.business_name,
      profile.data.phone_number,
      profile.data.avatar_url,
      profile.data.bio,
      profile.data.bank_name,
      profile.data.account_number
    ];
    const filled = fields.filter(f => !!f).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = getCompletion();
  const walletBalance = Number(profile.data?.wallet_balance || 0);

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

  const quickLog = async (amt: number, note = "Daily Income") => {
    setActiveQuickLog(amt);
    try {
      await addIncome.mutateAsync({
        amount: amt,
        note: note,
        entry_date: new Date().toISOString().split('T')[0]
      });
      toast.success(`GH₵ ${amt} logged!`);
      setIncomeNote("");
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
    await quickLog(amt, incomeNote || "Daily Income");
    setCustomAmount("");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "income": return { icon: ArrowUpRight, color: "text-emerald-500 bg-emerald-500/10", label: "Income" };
      case "expense": return { icon: ArrowDownLeft, color: "text-red-500 bg-red-500/10", label: "Expense" };
      case "loan_repayment": return { icon: PieChart, color: "text-blue-500 bg-blue-500/10", label: "Loan Pay" };
      case "order": return { icon: ShoppingBag, color: "text-purple-500 bg-purple-500/10", label: "Order" };
      case "susu_contribution": return { icon: Wallet, color: "text-gold bg-gold/10", label: "Susu" };
      default: return { icon: TrendingUp, color: "text-primary bg-primary/10", label: "Activity" };
    }
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
          {/* Profile Completion Bar */}
          {completion < 100 && (
            <Card className="p-4 bg-primary/5 border-dashed border-primary/30 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">Profile {completion}% Complete</span>
                </div>
                <Link to="/app/settings" className="text-[10px] font-bold text-primary hover:underline">Finish Setup →</Link>
              </div>
              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard label="Wallet Balance" value={`GH₵ ${walletBalance.toLocaleString()}`} hint="Available for use" />
            <StatCard label="Income this month" value={`GH₵ ${monthIncome.toLocaleString()}`} hint={`${(income.data ?? []).length} entries total`} />
            <StatCard label="Profit this month" value={`GH₵ ${profit.toLocaleString()}`} hint={profit >= 0 ? "In the green" : "Spend > earn"} />
            <StatCard label="Loan outstanding" value={`GH₵ ${outstanding.toLocaleString()}`} hint={`${(loans.data ?? []).length} application(s)`} />
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <h3 className="font-display font-bold text-sm uppercase tracking-tight">Log Daily Income</h3>
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
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount (GH₵)..."
                  className="h-10 bg-background flex-1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <Button type="submit" size="sm" className="px-6 h-10 font-bold" disabled={addIncome.isPending || !customAmount}>
                  {addIncome.isPending && !activeQuickLog ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Log Income
                </Button>
              </div>
              <Input
                placeholder="What did you earn this from? (Optional)"
                className="h-9 text-xs bg-background/50 border-dashed"
                value={incomeNote}
                onChange={(e) => setIncomeNote(e.target.value)}
              />
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
          {activity.isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (activity.data ?? []).length === 0 ? (
            <EmptyState title="No activity yet" hint="Start logging your daily income to build your ClipScore." />
          ) : (
            <Card className="p-0 overflow-hidden">
              <ul className="divide-y divide-border text-sm">
                {(activity.data ?? []).map((i) => {
                  const { icon: Icon, color, label } = getActivityIcon(i.type);
                  const isPositive = i.type === "income";

                  return (
                    <li key={`${i.type}-${i.id}`} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-none mb-1">{i.note}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {label} · {new Date(i.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-black text-base ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                          {isPositive ? '+' : '-'} GH₵ {i.amount.toLocaleString()}
                        </span>
                        {i.status && (
                          <span className={`text-[9px] font-black uppercase px-1.5 rounded-full ${
                            i.status === 'confirmed' || i.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                          }`}>
                            {i.status}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link to="/app/income" className="block p-3 text-center text-xs font-bold text-primary hover:bg-primary/5 border-t border-border">
                View detailed history →
              </Link>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="font-display font-semibold mb-4">Quick actions</h2>
          <div className="grid gap-3">
            {[
              ["Detailed Income", "/app/income", TrendingUp, "emerald"],
              ["Manage Expenses", "/app/expenses", ArrowDownLeft, "red"],
              ["Credit & Loans", "/app/loans", PieChart, "blue"],
              ["ClipMarket Shop", "/app/market", ShoppingBag, "purple"],
            ].map(([label, to, Icon, color]) => (
              <Link key={to as string} to={to as string} className="flex items-center justify-between rounded-xl bg-surface border border-border hover:border-primary/50 p-4 transition shadow-sm hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600' :
                    color === 'red' ? 'bg-red-500/10 text-red-600 group-hover:bg-red-600' :
                    color === 'blue' ? 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-600' :
                    'bg-purple-500/10 text-purple-600 group-hover:bg-purple-600'
                  } group-hover:text-white`}>
                    <Icon className="w-4 h-4" />
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
