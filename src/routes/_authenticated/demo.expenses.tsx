import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/demo/expenses")({
  component: ExpensesPage,
});

const cats = ["Supplies", "Rent", "Electricity", "Transport", "Other"];

function ExpensesPage() {
  const { expenses, income, addExpense } = useDemo();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Supplies");
  const [note, setNote] = useState("");

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInc = income.reduce((s, i) => s + i.amount, 0);
  const profit = totalInc - totalExp;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!isNaN(n) && n > 0) {
      addExpense(n, cat, note || cat);
      setAmount("");
      setNote("");
    }
  }

  return (
    <div className="pt-4 space-y-5">
      <h1 className="text-xl font-display font-bold">Expenses</h1>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-elevated border border-border p-3">
          <div className="text-[10px] text-muted-foreground">Income</div>
          <div className="text-sm font-bold text-primary">GH₵ {totalInc}</div>
        </div>
        <div className="rounded-xl bg-surface-elevated border border-border p-3">
          <div className="text-[10px] text-muted-foreground">Expenses</div>
          <div className="text-sm font-bold text-destructive">GH₵ {totalExp}</div>
        </div>
        <div className="rounded-xl bg-gold/10 border border-gold/30 p-3">
          <div className="text-[10px] text-muted-foreground">Profit</div>
          <div className="text-sm font-bold text-gold">GH₵ {profit}</div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-surface-elevated border border-border p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add expense</div>
        <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2">
          <span className="text-muted-foreground text-sm">GH₵</span>
          <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-transparent outline-none text-lg font-bold" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button type="button" key={c} onClick={() => setCat(c)} className={`text-[11px] rounded-full px-3 py-1 border transition ${cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm outline-none" />
        <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:bg-primary/90 transition">Save</button>
      </form>

      <div className="space-y-2">
        {[...expenses].reverse().map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold">{e.note}</div>
              <div className="text-[10px] text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </div>
            <div className="text-sm font-bold text-destructive">−GH₵ {e.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
