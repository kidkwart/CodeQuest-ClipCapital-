import { Card } from "@/components/app-shell";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export function LoanCalculator({ defaultAmount = 500, maxAmount = 5000 }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [term, setTerm] = useState(3);
  const interestRate = 15; // 15% monthly interest

  const interest = amount * (interestRate / 100) * term;
  const total = amount + interest;
  const monthly = total / term;

  return (
    <Card className="bg-surface-elevated border-primary/20">
      <h4 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          %
        </span>
        Loan Estimator
      </h4>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <span className="text-sm font-bold text-primary">GH₵ {amount.toLocaleString()}</span>
          </div>
          <Slider
            value={[amount]}
            min={100}
            max={maxAmount}
            step={50}
            onValueChange={([v]) => setAmount(v)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Term</Label>
            <span className="text-sm font-bold text-primary">{term} Months</span>
          </div>
          <Slider
            value={[term]}
            min={1}
            max={12}
            step={1}
            onValueChange={([v]) => setTerm(v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Interest (15%/mo)</div>
            <div className="text-sm font-semibold text-foreground">GH₵ {interest.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Payable</div>
            <div className="text-sm font-bold text-gold">GH₵ {total.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <div className="text-[10px] text-primary font-semibold uppercase tracking-wider">Estimated Monthly</div>
          <div className="text-xl font-display font-bold text-primary">GH₵ {Math.round(monthly).toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
}
