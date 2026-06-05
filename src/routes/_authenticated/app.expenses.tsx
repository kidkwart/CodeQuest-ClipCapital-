import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAddExpense, useDeleteExpense, useExpenses } from "@/lib/app-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/expenses")({
  component: Expenses,
});

const schema = z.object({
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  note: z.string().max(200).default(""),
  entry_date: z.string().min(1),
});

const CATEGORIES = ["Supplies", "Rent", "Electricity", "Water", "Transport", "Staff", "Other"];

function Expenses() {
  const list = useExpenses();
  const add = useAddExpense();
  const del = useDeleteExpense();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ amount, category, note, entry_date: date });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      await add.mutateAsync(parsed.data);
      setAmount(""); setNote("");
      toast.success("Expense logged");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Expenses">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="font-display font-semibold mb-3">Log expense</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Amount (GH₵)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label>Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
            </div>
            <Button type="submit" disabled={add.isPending} className="w-full">
              {add.isPending ? "Saving…" : "Add expense"}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">All expenses</h3>
          {(list.data ?? []).length === 0 ? (
            <EmptyState title="No expenses yet" />
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {(list.data ?? []).map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{i.entry_date} · {i.category}</div>
                      <div className="truncate text-sm">{i.note || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">GH₵ {Number(i.amount).toLocaleString()}</div>
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(i.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
