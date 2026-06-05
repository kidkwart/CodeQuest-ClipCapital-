import { createFileRoute, Link } from "@tanstack/react-router";
import { useDemo } from "@/lib/demo-store";
import { ClipScoreGauge } from "@/components/clip-score-gauge";

export const Route = createFileRoute("/_authenticated/demo/")({
  component: DemoHome,
});

function DemoHome() {
  const { income, clipScore, loanBalance, susuGroups } = useDemo();
  const todayTotal = income.filter((i) => i.date === new Date().toISOString().slice(0, 10)).reduce((s, i) => s + i.amount, 0);
  const weekTotal = income.reduce((s, i) => s + i.amount, 0);
  const myPot = susuGroups.filter((g) => g.joined).reduce((s, g) => s + g.pot, 0);

  return (
    <div className="pt-4 space-y-5">
      <div>
        <div className="text-xs text-muted-foreground">Akwaaba 👋</div>
        <h1 className="text-2xl font-display font-bold">Kwame Mensah</h1>
        <div className="text-xs text-muted-foreground">Madina Cuts · Accra</div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/25 to-gold/10 border border-primary/30 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Today's earnings</div>
            <div className="text-3xl font-display font-bold mt-1">GH₵ {todayTotal.toFixed(0)}</div>
            <div className="text-[11px] text-primary mt-1">GH₵ {weekTotal.toFixed(0)} this week</div>
          </div>
          <Link to="/demo/income" className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5">+ Log</Link>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-elevated border border-border p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">ClipScore</div>
          <div className="text-[11px] text-muted-foreground mt-1 max-w-[140px]">Built from 90 days of records. Higher score = bigger loans.</div>
        </div>
        <ClipScoreGauge score={clipScore} size={140} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/demo/susu" className="rounded-2xl bg-surface-elevated border border-border p-4 hover:border-primary/50 transition">
          <div className="text-2xl">🤝</div>
          <div className="text-[10px] text-muted-foreground mt-2">ClipSusu pot</div>
          <div className="text-lg font-bold">GH₵ {myPot.toFixed(0)}</div>
          <div className="text-[10px] text-gold">+5% APR</div>
        </Link>
        <Link to="/demo/loans" className="rounded-2xl bg-surface-elevated border border-border p-4 hover:border-primary/50 transition">
          <div className="text-2xl">💰</div>
          <div className="text-[10px] text-muted-foreground mt-2">Loan balance</div>
          <div className="text-lg font-bold">GH₵ {loanBalance}</div>
          <div className="text-[10px] text-gold">GH₵ 12 due today</div>
        </Link>
      </div>

      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Quick actions</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: "/demo/income", icon: "📈", label: "Income" },
            { to: "/demo/expenses", icon: "🧾", label: "Expense" },
            { to: "/demo/market", icon: "🛒", label: "Shop" },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="rounded-xl bg-surface-elevated border border-border p-3 text-center">
              <div className="text-xl">{a.icon}</div>
              <div className="text-[10px] mt-1">{a.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider">💡 Tip</div>
        <div className="text-sm mt-1">Log income every day for 7 days straight and earn +15 ClipScore bonus points.</div>
      </div>
    </div>
  );
}
