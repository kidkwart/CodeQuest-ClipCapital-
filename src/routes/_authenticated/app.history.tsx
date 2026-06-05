import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, EmptyState, StatCard } from "@/components/app-shell";
import { useTransactionHistory } from "@/lib/app-queries";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Wallet,
  Banknote,
  TrendingUp,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { data: history, isLoading } = useTransactionHistory();
  const [filter, setFilter] = useState<string>("all");

  const filteredHistory = history?.filter(t => {
    if (filter === "all") return true;
    if (filter === "in") return t.amount > 0;
    if (filter === "out") return t.amount < 0;
    return true;
  });

  const moneyIn = history?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0;
  const moneyOut = Math.abs(history?.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0) ?? 0);

  const getIcon = (type: string, amount: number) => {
    if (type === "order") return <ShoppingBag className="w-4 h-4" />;
    if (type.startsWith("susu")) return <Wallet className="w-4 h-4" />;
    if (type.startsWith("loan")) return <Banknote className="w-4 h-4" />;
    return amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />;
  };

  return (
    <AppShell title="Money History">
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          label="Total Money In"
          value={`GH₵ ${moneyIn.toLocaleString()}`}
          hint="Lifetime earnings & payouts"
        />
        <StatCard
          label="Total Money Out"
          value={`GH₵ ${moneyOut.toLocaleString()}`}
          hint="Total spending & savings"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>

        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-[10px] uppercase font-bold px-3 rounded-md"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "in" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-[10px] uppercase font-bold px-3 rounded-md"
            onClick={() => setFilter("in")}
          >
            In
          </Button>
          <Button
            variant={filter === "out" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-[10px] uppercase font-bold px-3 rounded-md"
            onClick={() => setFilter("out")}
          >
            Out
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 w-full rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (filteredHistory ?? []).length === 0 ? (
        <EmptyState
          title="No transactions found"
          hint="Your financial activity will appear here once you start using the app features."
        />
      ) : (
        <div className="space-y-3">
          {filteredHistory!.map((t) => (
            <Card key={`${t.type}-${t.id}`} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    t.amount > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                  )}>
                    {getIcon(t.type, t.amount)}
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">
                      {format(new Date(t.date), "MMM d, yyyy · h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-display font-bold text-lg",
                    t.amount > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {t.amount > 0 ? "+" : ""} GH₵ {Math.abs(t.amount).toLocaleString()}
                  </div>
                  {t.status && (
                    <div className="text-[9px] font-bold uppercase text-muted-foreground italic">
                      {t.status}
                    </div>
                  )}
                </div>
              </div>
              {t.note && (
                <div className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md italic">
                  "{t.note}"
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
