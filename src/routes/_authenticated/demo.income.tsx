import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAddIncome, useIncome } from "@/lib/demo-queries";

export const Route = createFileRoute("/_authenticated/demo/income")({
  component: IncomePage,
});

function IncomePage() {
  const { data: income = [] } = useIncome();
  const addIncome = useAddIncome();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const chartData = [...income].slice(-7).map((i) => ({
    day: new Date(i.entry_date).toLocaleDateString("en-GB", { weekday: "short" }),
    amount: Number(i.amount),
  }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!isNaN(n) && n > 0) {
      addIncome.mutate(
        { amount: n, note: note || "Cash takings" },
        { onSuccess: () => { setAmount(""); setNote(""); } }
      );
    }
  }

  const total = income.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="pt-4 space-y-5">
      <h1 className="text-xl font-display font-bold">Income tracker</h1>

      <div className="rounded-2xl bg-surface-elevated border border-border p-4">
        <div className="text-xs text-muted-foreground">Total logged</div>
        <div className="text-2xl font-display font-bold">GH₵ {total.toFixed(0)}</div>
        <div className="h-32 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="oklch(0.32 0.02 160 / 30%)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.7 0.02 100)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.022 160)", border: "1px solid oklch(0.32 0.02 160)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="amount" fill="oklch(0.62 0.15 160)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-surface-elevated border border-border p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Log earnings</div>
        <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2">
          <span className="text-muted-foreground text-sm">GH₵</span>
          <input
            type="number" inputMode="decimal" placeholder="0" min="0" step="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent outline-none text-lg font-bold"
          />
        </div>
        <input
          type="text" placeholder="Note (e.g. 14 cuts)" maxLength={120}
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm outline-none"
        />
        <button type="submit" disabled={addIncome.isPending} className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60">
          {addIncome.isPending ? "Saving…" : "Add to today"}
        </button>
      </form>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent entries</div>
        <div className="space-y-2">
          {income.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6">No entries yet — log your first earnings above.</div>
          )}
          {[...income].reverse().slice(0, 8).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl bg-surface-elevated border border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{i.note}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(i.entry_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</div>
              </div>
              <div className="text-sm font-bold text-primary">+GH₵ {Number(i.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
