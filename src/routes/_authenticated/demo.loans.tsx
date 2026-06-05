import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { computeClipScore, useIncome, useProfile } from "@/lib/demo-queries";

export const Route = createFileRoute("/_authenticated/demo/loans")({
  component: LoansPage,
});

function LoansPage() {
  const { data: profile } = useProfile();
  const { data: income = [] } = useIncome();
  const loanBalance = Number(profile?.loan_balance ?? 0);
  const clipScore = computeClipScore(income.length);

  const [requested, setRequested] = useState(2000);
  const eligible = clipScore >= 650;
  const dailyRepay = Math.ceil((requested * 1.06) / 90);

  return (
    <div className="pt-4 space-y-5">
      <h1 className="text-xl font-display font-bold">ClipLoans</h1>

      <div className="rounded-2xl bg-gradient-to-br from-gold/20 to-primary/10 border border-gold/30 p-5">
        <div className="text-xs text-muted-foreground">Current loan balance</div>
        <div className="text-3xl font-display font-bold mt-1">GH₵ {loanBalance.toFixed(0)}</div>
        {loanBalance > 0 ? (
          <div className="mt-3 text-[10px] text-muted-foreground">Repayments auto-deduct from your MoMo wallet.</div>
        ) : (
          <div className="mt-3 text-[10px] text-muted-foreground">No active loan. Apply below to get started.</div>
        )}
      </div>

      <div className="rounded-2xl bg-surface-elevated border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apply for new loan</div>
          <span className={`text-[10px] font-bold rounded-full px-2 py-1 ${eligible ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
            {eligible ? "Eligible" : "Build score"}
          </span>
        </div>
        <div className="text-3xl font-display font-bold">GH₵ {requested.toLocaleString()}</div>
        <input
          type="range" min={200} max={5000} step={100} value={requested}
          onChange={(e) => setRequested(parseInt(e.target.value))}
          className="w-full mt-3 accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>GH₵ 200</span>
          <span>GH₵ 5,000</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-background border border-border p-3">
            <div className="text-muted-foreground">Daily repayment</div>
            <div className="font-bold text-foreground mt-1">GH₵ {dailyRepay}</div>
          </div>
          <div className="rounded-xl bg-background border border-border p-3">
            <div className="text-muted-foreground">Term · Interest</div>
            <div className="font-bold text-foreground mt-1">90 days · 6%</div>
          </div>
        </div>

        <button disabled={!eligible} className="mt-4 w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {eligible ? "Apply via MTN MoMo" : `Log more income to grow your score (you have ${clipScore})`}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-2">How it works</div>
        <ol className="space-y-2 text-xs text-muted-foreground">
          <li><span className="text-foreground font-semibold">1.</span> Apply in-app — no paperwork.</li>
          <li><span className="text-foreground font-semibold">2.</span> Funds delivered to your MoMo wallet within hours.</li>
          <li><span className="text-foreground font-semibold">3.</span> Daily auto-deductions from your wallet.</li>
          <li><span className="text-foreground font-semibold">4.</span> On-time repayment grows your ClipScore & loan ceiling.</li>
        </ol>
      </div>
    </div>
  );
}
