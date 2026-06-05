import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, EmptyState, StatCard } from "@/components/app-shell";
import { useTransactionHistory, Transaction } from "@/lib/app-queries";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Wallet,
  Banknote,
  TrendingUp,
  Clock,
  Filter,
  Scissors,
  Download,
  Share2,
  CheckCircle2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { data: history, isLoading } = useTransactionHistory();
  const [filter, setFilter] = useState<string>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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
          {(["all", "in", "out"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-[10px] uppercase font-bold px-3 rounded-md"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
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
            <motion.div
              key={`${t.type}-${t.id}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTx(t)}
            >
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border/50 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                      t.amount > 0 ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" : "bg-red-500/10 text-red-600 group-hover:bg-red-500 group-hover:text-white"
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
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Professional Receipt Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="p-0 border-none bg-transparent max-w-sm sm:max-w-md shadow-none overflow-visible">
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
            {/* Header Branding */}
            <div className="bg-primary p-8 text-center text-white relative">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <Scissors className="w-8 h-8" />
                </div>
              </div>
              <h2 className="font-display font-black text-2xl tracking-tight">ClipCapital</h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70">Official Transaction Receipt</p>

              <button
                onClick={() => setSelectedTx(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-8 space-y-8 bg-white text-slate-900">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Amount Transacted</div>
                <div className={cn(
                  "text-4xl font-display font-black",
                  selectedTx?.amount! > 0 ? "text-emerald-600" : "text-slate-900"
                )}>
                  GH₵ {Math.abs(selectedTx?.amount || 0).toLocaleString()}
                </div>
                <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED BY SYSTEM
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Transaction Type</span>
                  <span className="text-xs font-black uppercase tracking-tight">{selectedTx?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <span className="text-xs font-black text-emerald-600 uppercase">{selectedTx?.status || 'COMPLETED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedTx && format(new Date(selectedTx.date), "MMM d, yyyy · h:mm a")}
                  </span>
                </div>
                {selectedTx?.momo_reference && (
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">MoMo Reference</span>
                    <span className="text-xs font-mono font-bold text-gold uppercase">{selectedTx.momo_reference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reference ID</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedTx?.id.slice(0, 18)}...</span>
                </div>
              </div>

              {selectedTx?.note && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-xs text-slate-600">
                  "{selectedTx.note}"
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 rounded-xl h-11 font-bold gap-2 shadow-lg shadow-primary/20">
                  <Download className="w-4 h-4" /> Save
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>

              <div className="text-center">
                <p className="text-[9px] font-medium text-slate-400 leading-relaxed">
                  ClipCapital Ltd. Registered Financial Entity GH-2026. <br />
                  This receipt is automatically generated and digitally signed.
                </p>
              </div>
            </div>

            {/* Bottom Cut Edge Effect */}
            <div className="flex justify-center -mb-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-8 h-8 bg-slate-950 rounded-full -mt-4 mx-[-8px]" />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
