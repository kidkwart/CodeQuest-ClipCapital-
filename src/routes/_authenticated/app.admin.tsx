import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMyRoles, usePendingLoans, useReviewLoan,
  useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useAllProductRequests, useAllOrders, useUpdateOrderStatus, useAllProfiles,
  useAdminStats, useAllUserMessages, useReplyToUser, useUserHealth, useAdjustUser,
  usePendingRepayments, useConfirmRepayment, useSystemLogs, useAllSusuGroups, useGroupMembers, useDisburseSusuPot
} from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import {
  Trash2, Loader2, Banknote, MessageSquarePlus, ShieldCheck,
  ShoppingCart, Package, ExternalLink, Users, TrendingUp,
  DollarSign, MessageCircle, Send, AlertTriangle,
  CheckCircle2, HeartPulse, Activity, LayoutGrid,
  Settings, Database, Server, RefreshCw, ChevronLeft,
  CircleDot, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/app/admin")({
  component: AdminPage,
});

function AdminPage() {
  const roles = useMyRoles();
  const { user, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<string>("stats");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, [user, userLoading, roles.status]);

  if (roles.isLoading || userLoading || !isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-gold" />
          <div className="space-y-2">
            <div className="text-gold font-display font-bold tracking-widest uppercase text-xs">Initializing Secure Terminal...</div>
            <div className="text-slate-600 text-[10px] font-mono">CC-GH-NODE-01 CONNECTED</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-10 text-slate-500 hover:text-white text-[10px]"
            onClick={() => setIsReady(true)}
          >
            Bypass
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";

  if (!isAdmin) {
    return <Navigate to="/app" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-gold/30 overflow-x-hidden">
      {/* Admin Top bar */}
      <div className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gold p-1.5 rounded shadow-lg shadow-gold/20">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-gold uppercase leading-tight">ClipCapital Hub</div>
            <div className="text-[10px] text-slate-500 font-mono">SECURE ACCESS: {user?.email?.slice(0, 8)}...</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-tighter">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <CircleDot className="w-2 h-2 fill-emerald-500" /> LIVE TERMINAL
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Admin Navigation */}
        <div className="w-full lg:w-64 border-r border-white/5 bg-black/20 p-4 space-y-1 overflow-x-auto lg:overflow-x-visible">
          <div className="flex lg:flex-col gap-1">
            {[
              { id: "stats", label: "Insights", icon: LayoutGrid },
              { id: "loans", label: "Lending", icon: Banknote },
              { id: "repayments", label: "Repayments", icon: Activity },
              { id: "susu", label: "Susu Hub", icon: Wallet },
              { id: "orders", label: "Orders", icon: Package },
              { id: "users", label: "Borrowers", icon: Users },
              { id: "support", label: "Support", icon: MessageCircle },
              { id: "inventory", label: "Stock", icon: Database },
              { id: "logs", label: "Audit Logs", icon: Server },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-gold text-black shadow-lg shadow-gold/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" /> <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-10 hidden lg:block">
             <Link to="/app" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider">
               <ChevronLeft className="w-4 h-4" /> Exit Terminal
             </Link>
          </div>
        </div>

        {/* Admin Content Area */}
        <div className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            {activeTab === "stats" && <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><DailyReport /></motion.div>}
            {activeTab === "loans" && <motion.div key="loans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><LoanQueue /></motion.div>}
            {activeTab === "repayments" && <motion.div key="repayments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><RepaymentDesk /></motion.div>}
            {activeTab === "susu" && <motion.div key="susu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><SusuMaturityDesk /></motion.div>}
            {activeTab === "orders" && <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><OrderQueue /></motion.div>}
            {activeTab === "users" && <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><UserDirectory /></motion.div>}
            {activeTab === "support" && <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><SupportInbox /></motion.div>}
            {activeTab === "inventory" && <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ProductManager /></motion.div>}
            {activeTab === "logs" && <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><SystemLogView /></motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DailyReport() {
  const stats = useAdminStats();
  const logs = useSystemLogs();

  if (stats.isLoading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-display font-black text-white mb-1">Portfolio Insights</h2>
        <p className="text-slate-500 text-sm">Real-time aggregate data across the network.</p>
      </div>

      {/* CEO Big Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-gold text-black relative overflow-hidden group">
          <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="relative">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-black/60">Total Liquidity</div>
            <div className="text-4xl font-display font-black">GH₵ {stats.data?.totalCash.toLocaleString() || 0}</div>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/10 text-white relative overflow-hidden">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Capital at Risk</div>
          <div className="text-4xl font-display font-black text-red-500">GH₵ {stats.data?.activeRisk.toLocaleString() || 0}</div>
        </div>

        <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/10 text-white relative overflow-hidden">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Lending Efficiency</div>
          <div className="text-4xl font-display font-black text-emerald-500">{stats.data?.approvalRate || 0}%</div>
        </div>
      </div>

      {/* Live Activity Ticker */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Bell className="w-3 h-3 text-gold" />
          Live Event Stream
        </h3>
        <div className="grid gap-2">
          {(logs.data ?? []).slice(0, 3).map((l: any) => (
            <div key={l.id} className="bg-white/5 border border-white/5 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  l.event_type === 'purchase' ? 'bg-emerald-500' : 'bg-blue-500'
                )} />
                <span className="text-slate-200">
                  <span className="font-bold text-gold uppercase">{l.event_type.replace('_', ' ')}</span>:
                  {' '}{l.profiles?.display_name || 'System'} just transacted.
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">{format(new Date(l.created_at), "HH:mm")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        {[
          { label: "Daily Income Flow", val: stats.data?.dailyIncome, color: "text-emerald-500" },
          { label: "Shop Revenue", val: stats.data?.dailySales, color: "text-gold" },
          { label: "New Disbursements", val: stats.data?.dailyLoans, color: "text-blue-500" },
          { label: "Global Volume", val: stats.data?.totalVolume, color: "text-white" }
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/5 p-5 rounded-2xl">
            <div className="text-[9px] font-black uppercase text-slate-500 mb-2">{s.label}</div>
            <div className={cn("text-xl font-display font-black", s.color)}>GH₵ {s.val?.toLocaleString() || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserDirectory() {
  const users = useAllProfiles();
  if (users.isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-black text-white mb-1">Borrower Registry</h2>
          <p className="text-slate-500 text-sm">Full index of registered artisans.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="bg-white/5 text-slate-500 uppercase font-black tracking-tighter">
            <tr>
              <th className="px-6 py-4">Artisan</th>
              <th className="px-6 py-4">Business</th>
              <th className="px-6 py-4">Region</th>
              <th className="px-6 py-4 text-right">ClipScore</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.data!.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-black">{u.display_name?.charAt(0)}</div>
                    <div className="font-bold text-white">{u.display_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">{u.business_name}</td>
                <td className="px-6 py-4 text-slate-400">{u.location}</td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    "font-black text-sm px-2 py-1 rounded bg-black/40 border border-white/5",
                    u.clip_score >= 700 ? "text-emerald-500" : u.clip_score >= 400 ? "text-gold" : "text-red-500"
                  )}>{u.clip_score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoanQueue() {
  const list = usePendingLoans();
  const review = useReviewLoan();
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [interestById, setInterestById] = useState<Record<string, string>>({});
  const [showHealthFor, setShowHealthHealthFor] = useState<string | null>(null);

  if (list.isLoading) return <div className="h-64 bg-white/5 animate-pulse rounded-2xl" />;
  if ((list.data ?? []).length === 0) return <EmptyState title="Queue Empty" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Lending Desk</h2>
        <p className="text-slate-500 text-sm">Action required on credit applications.</p>
      </div>

      <div className="space-y-4">
        {list.data!.map((l) => (
          <div key={l.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-gold/30 transition-colors">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                   <div className="text-xl font-display font-black text-white">{(l as any).profiles?.display_name}</div>
                   <button
                     onClick={() => setShowHealthHealthFor(showHealthFor === l.user_id ? null : l.user_id)}
                     className="px-2 py-1 rounded bg-white/10 text-[9px] font-black uppercase text-slate-400 hover:bg-gold hover:text-black transition-colors"
                   >
                     {showHealthFor === l.user_id ? 'Close Audit' : 'Run Risk Audit'}
                   </button>
                </div>

                {showHealthFor === l.user_id && <BorrowerHealth userId={l.user_id} />}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Request</div>
                      <div className="text-lg font-black text-gold">GH₵ {Number(l.amount).toLocaleString()}</div>
                   </div>
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Term</div>
                      <div className="text-lg font-black text-white">{l.term_months} Mo.</div>
                   </div>
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Purpose</div>
                      <div className="text-sm font-bold text-slate-300 truncate">{l.purpose}</div>
                   </div>
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Applied</div>
                      <div className="text-sm font-bold text-slate-300">{new Date(l.created_at).toLocaleDateString()}</div>
                   </div>
                </div>
              </div>

              {l.status === 'pending' && (
                <div className="md:w-72 bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Rate Adj. (%)</Label>
                      <Input
                        type="number"
                        className="bg-black/40 border-white/10 h-10 text-white font-bold"
                        value={interestById[l.id] ?? "5.0"}
                        onChange={(e) => setInterestById({...interestById, [l.id]: e.target.value})}
                      />
                   </div>
                   <div className="flex gap-2">
                      <Button className="flex-1 bg-gold text-black font-black uppercase text-[10px]" onClick={() => review.mutate({ id: l.id, status: 'approved', decision_note: 'Approved', interest_rate: Number(interestById[l.id] || 5) })}>Approve</Button>
                      <Button variant="outline" className="flex-1 border-white/10 text-red-500 uppercase text-[10px] font-black" onClick={() => review.mutate({ id: l.id, status: 'rejected', decision_note: 'Rejected' })}>Reject</Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepaymentDesk() {
  const list = usePendingRepayments();
  const confirm = useConfirmRepayment();

  if (list.isLoading) return <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Repayment Console</h2>
        <p className="text-slate-500 text-sm">Verify incoming MoMo payments.</p>
      </div>

      <div className="grid gap-4">
        {(list.data ?? []).length === 0 ? (
          <EmptyState title="No Repayments" hint="All payments processed." />
        ) : (
          list.data!.map(r => (
            <div key={r.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="bg-emerald-500/20 p-3 rounded-xl"><RefreshCw className="w-6 h-6 text-emerald-500" /></div>
                 <div>
                    <div className="text-lg font-black text-white">{r.profiles?.display_name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Settling: {r.loan_applications?.purpose}</div>
                    <div className="text-[10px] text-gold font-mono uppercase mt-1">{r.momo_provider} • {r.momo_reference}</div>
                 </div>
              </div>

              <div className="text-2xl font-display font-black text-emerald-500">GH₵ {Number(r.amount).toLocaleString()}</div>

              <div className="flex gap-2">
                 <Button size="sm" className="bg-emerald-600 text-white font-black uppercase text-[10px]" onClick={() => confirm.mutate({ id: r.id, status: 'confirmed' })}>Verify</Button>
                 <Button variant="outline" size="sm" className="border-red-500/30 text-red-500 uppercase text-[10px] font-black" onClick={() => confirm.mutate({ id: r.id, status: 'rejected' })}>Fraud</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SusuMaturityDesk() {
  const groups = useAllSusuGroups();

  if (groups.isLoading) return <div className="h-32 bg-white/5 animate-pulse rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Susu Maturity Hub</h2>
        <p className="text-slate-500 text-sm">Oversee group savings and disburse total pots to cycle winners.</p>
      </div>

      <div className="grid gap-6">
        {(groups.data ?? []).length === 0 ? (
          <EmptyState title="No Groups" hint="There are no Susu groups currently active." />
        ) : (
          groups.data!.map(g => (
            <SusuGroupAdminCard key={g.id} group={g} />
          ))
        )}
      </div>
    </div>
  );
}

function SusuGroupAdminCard({ group }: { group: any }) {
  const members = useGroupMembers(group.id);
  const disburse = useDisburseSusuPot();

  const nextInLine = members.data?.find(m => !m.has_received);

  const handleDisburse = async () => {
    if (!nextInLine) return;

    const promise = disburse.mutateAsync({
      group_id: group.id,
      user_id: nextInLine.user_id,
      amount: Number(group.pot)
    });

    toast.promise(promise, {
      loading: 'Processing Payout...',
      success: `GH₵ ${group.pot} disbursed to ${(nextInLine as any).profiles?.display_name}!`,
      error: 'Payout failed.',
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl"><Wallet className="w-6 h-6 text-blue-500" /></div>
          <div>
            <div className="text-lg font-black text-white">{group.name}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Cycle {group.cycle_index} • {group.frequency} • {members.data?.length || 0} Members
            </div>
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Pot Value</div>
          <div className="text-3xl font-display font-black text-gold">GH₵ {Number(group.pot).toLocaleString()}</div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          {nextInLine ? (
            <>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] text-slate-500 font-black uppercase">Next Winner</div>
                <div className="text-xs font-bold text-white">{(nextInLine as any).profiles?.display_name}</div>
              </div>
              <Button
                size="sm"
                className="bg-gold text-black font-black uppercase text-[10px] h-10 shadow-lg shadow-gold/10"
                disabled={group.pot === 0 || disburse.isPending}
                onClick={handleDisburse}
              >
                Disburse Pot
              </Button>
            </>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
              Cycle Complete
            </div>
          )}
        </div>
      </div>

      {/* Mini Member List */}
      <div className="px-6 pb-6 pt-2">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Payout Queue</div>
        <div className="flex flex-wrap gap-2">
          {members.data?.map((m, idx) => (
            <div
              key={m.id}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                m.has_received
                  ? "bg-slate-900 border-white/5 text-slate-500"
                  : m.user_id === nextInLine?.user_id
                    ? "bg-gold text-black border-gold shadow-sm"
                    : "bg-white/5 border-white/10 text-slate-400"
              )}
            >
              {idx + 1}. {(m as any).profiles?.display_name}
              {m.has_received && " (PAID)"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderQueue() {
  const orders = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  if (orders.isLoading) return <div className="animate-pulse h-32 bg-white/5 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Trade Hub</h2>
        <p className="text-slate-500 text-sm">Shipment and sales tracking.</p>
      </div>

      <div className="grid gap-4">
        {orders.data?.map(o => (
          <div key={o.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="bg-white/10 p-3 rounded-xl"><ShoppingCart className="w-6 h-6 text-gold" /></div>
               <div>
                  <div className="text-lg font-black text-white">Order #{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Customer: {(o as any).profiles?.display_name}</div>
               </div>
            </div>

            <div className="text-2xl font-display font-black text-gold">GH₵ {Number(o.total).toLocaleString()}</div>

            <div className="flex gap-2">
               {o.status === 'pending' && <Button size="sm" className="bg-gold text-black font-black uppercase text-[10px]" onClick={() => updateStatus.mutate({ id: o.id, status: 'paid' })}>Verify Payment</Button>}
               {o.status === 'paid' && <Button size="sm" className="bg-blue-600 text-white font-black uppercase text-[10px]" onClick={() => updateStatus.mutate({ id: o.id, status: 'delivered' })}>Mark Shipped</Button>}
               <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400">{o.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportInbox() {
  const messages = useAllUserMessages();
  const reply = useReplyToUser();
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  if (messages.isLoading) return <div className="text-muted-foreground animate-pulse">Loading messages...</div>;

  const grouped: Record<string, any[]> = {};
  messages.data?.forEach(m => { if (!grouped[m.user_id]) grouped[m.user_id] = []; grouped[m.user_id].push(m); });
  const userIds = Object.keys(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Encrypted Security Comms</h2>
        <p className="text-slate-500 text-sm">Direct bridge to customers.</p>
      </div>

      <div className="grid gap-6">
        {userIds.map(userId => {
          const userMsgs = grouped[userId];
          if (!userMsgs || userMsgs.length === 0) return null;
          const firstMsg = userMsgs[0];

          return (
            <div key={userId} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
               <div className="flex justify-between items-center mb-6">
                  <div className="text-lg font-black text-white">{(firstMsg as any).profiles?.display_name || 'Artisan'}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase">Status: {firstMsg?.created_at ? format(new Date(firstMsg.created_at), "h:mm a") : 'Active'}</div>
               </div>

               <div className="bg-black/40 p-4 rounded-xl h-48 overflow-y-auto mb-4 border border-white/5 space-y-3">
                  {[...(userMsgs || [])].reverse().map(m => (
                    <div key={m.id} className={cn("text-xs p-3 rounded-lg max-w-[80%]", m.is_from_admin ? "bg-gold text-black ml-auto font-bold" : "bg-white/10 text-white")}>
                      {m.message}
                    </div>
                  ))}
               </div>

               <div className="flex gap-2">
                  <Input className="bg-white/5 border-white/10 text-white h-11" placeholder="Secure response..." value={replyText[userId] || ""} onChange={(e) => setReplyText({...replyText, [userId]: e.target.value})} />
                  <Button className="bg-gold text-black h-11 w-11 p-0 flex items-center justify-center" onClick={() => reply.mutate({ user_id: userId, message: replyText[userId] })}><Send className="w-4 h-4" /></Button>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductManager() {
  const list = useAllProducts();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "", stock: "1" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Global Stock Ledger</h2>
        <p className="text-slate-500 text-sm">Control warehouse and overrides.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 h-fit">
            <h4 className="text-xs font-black uppercase text-gold tracking-widest">Provision New Item</h4>
            <div className="space-y-3">
               <Input className="bg-black/40 border-white/10 text-white" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               <Input className="bg-black/40 border-white/10 text-white" placeholder="Price (GH₵)" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
               <Button className="w-full bg-gold text-black font-black uppercase text-xs h-12" onClick={() => create.mutate({ ...form, price: Number(form.price), stock: Number(form.stock) })}>Add to Inventory</Button>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-4">
            {list.data?.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                       <img src={p.image_url} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <div className="font-bold text-white">{p.name}</div>
                       <div className="text-xs text-slate-500">GH₵ {p.price}</div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" className="text-gold h-8 text-[10px] uppercase font-black" onClick={() => update.mutate({ id: p.id, active: !p.active })}>{p.active ? 'Hide' : 'Show'}</Button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function SystemLogView() {
  const logs = useSystemLogs();

  if (logs.isLoading) return <div className="space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Security Audit</h2>
        <p className="text-slate-500 text-sm">Immutable system events.</p>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <div className="text-[10px] font-black uppercase text-slate-400">Stream [GH-NODE-01]</div>
           <Button variant="ghost" size="sm" onClick={() => logs.refetch()} className="h-6 text-[10px] gap-1 text-gold"><RefreshCw className="w-3 h-3" /> Sync</Button>
        </div>
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {(logs.data ?? []).map((l: any) => (
            <div key={l.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  l.event_type === 'signup' ? 'bg-blue-500' :
                  l.event_type === 'loan_request' ? 'bg-orange-500' :
                  l.event_type === 'purchase' ? 'bg-emerald-500' : 'bg-slate-500'
                )} />
                <div>
                  <div className="text-[11px] font-black text-white uppercase">{l.event_type.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-slate-300">{l.profiles?.display_name || 'CORE'}</span>: {JSON.stringify(l.details)}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {format(new Date(l.created_at), "HH:mm:ss")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BorrowerHealth({ userId }: { userId: string }) {
  const health = useUserHealth(userId);
  if (health.isLoading) return <div className="mt-4 h-24 animate-pulse bg-white/5 rounded-xl" />;
  const data = health.data;

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Net Profit", val: "GH₵ " + data?.netProfit.toLocaleString(), color: "text-emerald-400" },
        { label: "Reliability", val: data?.susuReliability + "%", color: "text-blue-400" },
        { label: "Activity", val: data?.entryCount + " Logs", color: "text-purple-400" },
        { label: "Debt", val: "GH₵ " + data?.activeDebt.toLocaleString(), color: "text-red-400" }
      ].map(s => (
        <div key={s.label} className="bg-black/40 p-4 rounded-2xl border border-white/5">
           <div className="text-[8px] font-black uppercase text-slate-500 mb-1">{s.label}</div>
           <div className={cn("text-sm font-black", s.color)}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}
