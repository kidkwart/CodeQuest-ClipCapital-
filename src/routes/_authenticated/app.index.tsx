import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatCard, Card, EmptyState } from "@/components/app-shell";
import { ClipScoreGauge } from "@/components/clip-score-gauge";
import { useClipScore, useIncome, useExpenses, useMyLoans } from "@/lib/app-queries";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { score } = useClipScore();
  const income = useIncome();
  const expenses = useExpenses();
  const loans = useMyLoans();

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

  return (
    <AppShell title="Dashboard">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-1 flex flex-col items-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Your ClipScore</div>
          <ClipScoreGauge score={score} size={200} />
          <div className="text-xs text-muted-foreground mt-3 text-center">
            Eligible up to <span className="text-gold font-bold">GH₵ {maxLoan.toLocaleString()}</span>
          </div>
        </Card>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <StatCard label="Income this month" value={`GH₵ ${monthIncome.toLocaleString()}`} hint={`${(income.data ?? []).length} entries total`} />
          <StatCard label="Expenses this month" value={`GH₵ ${monthExpense.toLocaleString()}`} />
          <StatCard label="Profit this month" value={`GH₵ ${profit.toLocaleString()}`} hint={profit >= 0 ? "In the green" : "Spend > earn"} />
          <StatCard label="Loan outstanding" value={`GH₵ ${outstanding.toLocaleString()}`} hint={`${(loans.data ?? []).length} application(s)`} />
        </div>
      </div>

      <h2 className="font-display font-semibold mb-3">Quick actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Log income", "/app/income"],
          ["Log expense", "/app/expenses"],
          ["Apply for loan", "/app/loans"],
          ["Browse market", "/app/market"],
        ].map(([label, to]) => (
          <Link key={to} to={to} className="rounded-xl bg-surface border border-border hover:border-primary/50 p-5 transition">
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">Go →</div>
          </Link>
        ))}
      </div>

      <h2 className="font-display font-semibold mt-8 mb-3">Recent income</h2>
      {(income.data ?? []).length === 0 ? (
        <EmptyState title="No income logged yet" hint="Tap Log income to add your first entry." />
      ) : (
        <Card>
          <ul className="divide-y divide-border text-sm">
            {(income.data ?? []).slice(0, 5).map((i) => (
              <li key={i.id} className="py-2 flex justify-between">
                <span className="text-muted-foreground">{i.entry_date}</span>
                <span className="font-semibold">GH₵ {Number(i.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
