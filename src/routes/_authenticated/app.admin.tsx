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
  useAdminStats, useAllUserMessages, useReplyToUser, usePendingSusuPayouts,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus
} from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Trash2, Loader2, Banknote, MessageSquarePlus, ShieldCheck, Package, ExternalLink, Users, TrendingUp, MessageCircle, Send, Check, ArrowDownToLine, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/app/admin")({
  component: Admin,
});

function Admin() {
  const roles = useMyRoles();
  const { user, loading: userLoading } = useCurrentUser();

  if (roles.isLoading || userLoading) {
    return (
      <AppShell title="Admin">
        <div className="flex items-center gap-2 text-muted-foreground p-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking permissions...
        </div>
      </AppShell>
    );
  }

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";

  if (!isAdmin) return <Navigate to="/app" />;

  return (
    <AppShell title="Admin Control Center">
      <div className="space-y-12 pb-20">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-xl uppercase tracking-tight">System Health</h3>
          </div>
          <DailyReport />
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Loan Queue</h3>
            </div>
            <LoanQueue />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gold" />
              <h3 className="font-display font-bold text-xl">Susu Payouts</h3>
            </div>
            <SusuPayoutQueue />
          </section>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownToLine className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl">Withdrawal Requests</h3>
          </div>
          <WithdrawalQueue />
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Order Management</h3>
            </div>
            <OrderQueue />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquarePlus className="w-5 h-5 text-gold" />
              <h3 className="font-display font-bold text-xl">Custom Requests</h3>
            </div>
            <ProductRequestQueue />
          </section>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="font-display font-bold text-xl">User Directory</h3>
            </div>
            <UserDirectory />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Support Desk</h3>
            </div>
            <AdminSupportChat />
          </section>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl">Marketplace Inventory</h3>
          </div>
          <ProductManager />
        </section>
      </div>
    </AppShell>
  );
}

function DailyReport() {
  const stats = useAdminStats();
  if (stats.isLoading) return <div className="h-32 rounded-xl bg-muted animate-pulse" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="bg-emerald-500/10 border-emerald-500/20">
        <div className="text-[10px] uppercase font-bold text-emerald-600">User Income</div>
        <div className="text-xl font-display font-bold">GH₵ {stats.data?.dailyIncome.toLocaleString() || 0}</div>
      </Card>
      <Card className="bg-gold/10 border-gold/20">
        <div className="text-[10px] uppercase font-bold text-gold">Shop Sales</div>
        <div className="text-xl font-display font-bold">GH₵ {stats.data?.dailySales.toLocaleString() || 0}</div>
      </Card>
      <Card className="bg-blue-500/10 border-blue-500/20">
        <div className="text-[10px] uppercase font-bold text-blue-600">Loans Out</div>
        <div className="text-xl font-display font-bold">GH₵ {stats.data?.dailyLoans.toLocaleString() || 0}</div>
      </Card>
      <Card className="bg-primary/10 border-primary/20">
        <div className="text-[10px] uppercase font-bold text-primary">Total Volume</div>
        <div className="text-xl font-display font-bold text-primary">GH₵ {stats.data?.totalVolume.toLocaleString() || 0}</div>
      </Card>
      <Card className="bg-purple-500/10 border-purple-500/20">
        <div className="text-[10px] uppercase font-bold text-purple-600">Total Users</div>
        <div className="text-xl font-display font-bold text-purple-600">{stats.data?.totalUsers || 0}</div>
      </Card>
    </div>
  );
}

function LoanQueue() {
  const list = usePendingLoans();
  const review = useReviewLoan();
  const { user } = useCurrentUser();
  const [showHistory, setShowHistory] = useState(false);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [interestById, setInterestById] = useState<Record<string, string>>({});

  if (list.isLoading) return <div className="h-40 bg-muted animate-pulse rounded-2xl" />;

  const pending = (list.data ?? []).filter(l => l.status === "pending");
  const handledByMe = (list.data ?? []).filter(l => l.reviewed_by === user?.id && l.status !== "pending");

  const displayList = showHistory ? handledByMe : pending;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={!showHistory ? "default" : "outline"}
          size="sm"
          className="h-8 text-[10px] font-bold uppercase flex-1"
          onClick={() => setShowHistory(false)}
        >
          Pending ({pending.length})
        </Button>
        <Button
          variant={showHistory ? "default" : "outline"}
          size="sm"
          className="h-8 text-[10px] font-bold uppercase flex-1"
          onClick={() => setShowHistory(true)}
        >
          My History ({handledByMe.length})
        </Button>
      </div>

      {displayList.length === 0 ? (
        <EmptyState title="Queue clear" hint={showHistory ? "You haven't processed any loans yet." : "No new applications to review."} />
      ) : (
        displayList.map((l) => {
          const profile = (l as any).profiles;
          return (
            <Card key={l.id} className={cn("border-primary/20", l.status === 'rejected' && 'opacity-60 bg-muted/20')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-display font-bold text-base">{profile?.display_name ?? "User"}</div>
                  <div className="text-[11px] text-muted-foreground">{profile?.business_name ?? "Artisan"}</div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase font-black">Request</div>
                      <div className="font-bold text-lg">GH₵ {Number(l.amount).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground uppercase font-black">Term</div>
                      <div className="font-bold">{l.term_months} Mo.</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] p-2 bg-muted/30 rounded border border-border/50">
                    <span className="text-muted-foreground font-bold uppercase">Purpose:</span> {l.purpose}
                  </div>

                  {l.status === 'pending' && profile?.account_number && (
                    <div className="mt-3 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[10px]">
                      <div className="font-bold text-emerald-700 uppercase text-[8px] mb-1">MoMo Payout</div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-800">{profile.bank_name}: {profile.account_number}</span>
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[8px] font-black border border-emerald-500/20" onClick={() => { navigator.clipboard.writeText(profile.account_number); toast.success("Copied"); }}>Copy</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {l.status === "pending" ? (
                <div className="mt-6 space-y-4 border-t border-dashed border-border pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase">Interest (%)</Label>
                      <Input type="number" placeholder="15.0" step="0.1" className="h-8 text-xs font-bold" value={interestById[l.id] ?? "15.0"} onChange={(e) => setInterestById({ ...interestById, [l.id]: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase">Admin Note</Label>
                      <Input placeholder="Review note" className="h-8 text-xs" value={noteById[l.id] ?? ""} onChange={(e) => setNoteById({ ...noteById, [l.id]: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-emerald-600 h-9 text-[10px] font-black uppercase" disabled={review.isPending} onClick={async () => {
                      const promise = review.mutateAsync({ id: l.id, status: "approved", decision_note: noteById[l.id] ?? "", interest_rate: Number(interestById[l.id] ?? 15.0) });
                      toast.promise(promise, { loading: 'Approving...', success: 'Loan Approved!', error: 'Failed.' });
                    }}>Approve</Button>
                    <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive h-9 text-[10px] font-black uppercase" disabled={review.isPending} onClick={async () => {
                      await review.mutateAsync({ id: l.id, status: "rejected", decision_note: noteById[l.id] ?? "" });
                      toast.success("Rejected");
                    }}>Reject</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between items-center">
                  <div className={cn(
                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                    l.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                  )}>
                    {l.status}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase font-bold">Reviewed on {format(new Date(l.reviewed_at!), "MMM d")}</div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

function SusuPayoutQueue() {
  const payouts = usePendingSusuPayouts();
  if (payouts.isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if ((payouts.data ?? []).length === 0) return <EmptyState title="All payouts cleared" hint="No groups have active pots ready for disbursement." />;

  return (
    <div className="space-y-4">
      {payouts.data!.map((g) => (
        <Card key={g.id} className="border-gold/20 bg-gold/5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-display font-black text-base">{g.name}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Managed by {(g as any).owner?.display_name}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase font-black text-gold">Current Pot</div>
              <div className="font-black text-lg text-gold">GH₵ {Number(g.pot).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white/50 p-2 rounded-lg border border-gold/10 mb-3 text-[10px]">
            <div className="flex items-center gap-1.5 text-gold font-bold uppercase text-[8px] mb-1">
              <Check className="w-3 h-3" /> Ready for next member
            </div>
            <p className="text-muted-foreground leading-tight italic">Verify the next recipient and their MoMo details by clicking Review below.</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gold/10">
            <div className="text-[10px] font-medium text-muted-foreground">{g.members_count} Members · {g.frequency}</div>
            <Button size="sm" variant="outline" className="h-8 text-[10px] border-gold/30 text-gold hover:bg-gold hover:text-white" asChild>
              <Link to="/app/susu/$groupId" params={{ groupId: g.id }}>Review Recipient →</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WithdrawalQueue() {
  const requests = useAllWithdrawalRequests();
  const updateStatus = useUpdateWithdrawalStatus();
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  if (requests.isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if ((requests.data ?? []).length === 0) return <EmptyState title="All clear" hint="No pending withdrawal requests." />;

  const pending = requests.data!.filter(r => r.status === 'pending');
  const history = requests.data!.filter(r => r.status !== 'pending').slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pending.map((r) => (
          <Card key={r.id} className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-display font-black text-lg text-primary">GH₵ {Number(r.amount).toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Request by {(r as any).profiles?.display_name}</div>
              </div>
              <div className="text-[8px] bg-muted px-1.5 py-0.5 rounded font-black uppercase">{format(new Date(r.created_at!), "MMM d")}</div>
            </div>

            <div className="p-2 bg-muted/30 rounded-lg border border-border/50 text-[10px] space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase font-bold">MoMo/Bank:</span>
                <span className="font-bold">{r.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase font-bold">Account:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold tracking-wider">{r.account_number}</span>
                  <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => {
                    navigator.clipboard.writeText(r.account_number);
                    toast.success("Account copied");
                  }}>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
              <div className="text-muted-foreground italic truncate">{r.account_name}</div>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Notes (optional)"
                className="h-8 text-[10px]"
                value={noteById[r.id] ?? ""}
                onChange={e => setNoteById({...noteById, [r.id]: e.target.value})}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 h-8 text-[10px] font-black uppercase"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: r.id, status: 'completed', notes: noteById[r.id] })}
                >
                  Confirm Payout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-destructive text-destructive h-8 text-[10px] font-black uppercase"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: r.id, status: 'rejected', notes: noteById[r.id] })}
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Recently Processed</div>
          <div className="grid gap-3">
            {history.map(r => (
              <Card key={r.id} className="p-3 py-2 flex items-center justify-between bg-muted/20 border-border/40">
                <div className="flex items-center gap-3">
                  {r.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <div>
                    <div className="font-bold text-xs">GH₵ {Number(r.amount).toLocaleString()} — {(r as any).profiles?.display_name}</div>
                    <div className="text-[8px] text-muted-foreground uppercase">{format(new Date(r.processed_at!), "MMM d, HH:mm")}</div>
                  </div>
                </div>
                <div className={cn(
                  "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                  r.status === 'completed' ? "border-emerald-500/20 text-emerald-600" : "border-red-500/20 text-red-500"
                )}>
                  {r.status}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderQueue() {
  const orders = useAllOrders();
  const updateStatus = useUpdateOrderStatus();

  if (orders.isLoading) return <div className="text-muted-foreground animate-pulse">Loading orders...</div>;
  if ((orders.data ?? []).length === 0) return <EmptyState title="No orders yet" />;

  return (
    <div className="grid gap-4">
      {orders.data!.map((o) => (
        <Card key={o.id} className="border-border/50">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-base">Order #{o.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  By <span className="font-semibold">{(o as any).profiles?.display_name}</span>
                </div>
              </div>
              <div className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                o.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                o.status === "delivered" ? "bg-blue-500/10 text-blue-600" :
                "bg-orange-500/10 text-orange-600"
              )}>
                {o.status}
              </div>
            </div>
            <div className="text-xl font-display font-black text-primary">GH₵ {Number(o.total).toLocaleString()}</div>
            <div className="text-[10px] bg-muted/30 p-2 rounded border border-border/50">
              <div className="font-bold text-muted-foreground uppercase text-[8px] mb-1">Payment Reference</div>
              <div className="font-mono text-primary truncate">{(o as any).momo_reference || "N/A"}</div>
            </div>
            <div className="space-y-1">
              {(o as any).order_items?.map((item: any) => (
                <div key={item.id} className="text-[11px] flex justify-between text-muted-foreground italic">
                  <span>{item.qty}x {item.products?.name}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-dashed border-border mt-1">
              {o.status === "pending" && (
                <Button size="sm" className="flex-1 bg-emerald-600 h-8 text-[10px]" onClick={() => updateStatus.mutate({ id: o.id, status: "paid" })}>
                  Mark Paid
                </Button>
              )}
              {o.status === "paid" && (
                <Button size="sm" className="flex-1 bg-blue-600 h-8 text-[10px]" onClick={() => updateStatus.mutate({ id: o.id, status: "delivered" })}>
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProductRequestQueue() {
  const requests = useAllProductRequests();
  if (requests.isLoading) return <div className="text-muted-foreground animate-pulse">Loading requests...</div>;
  if ((requests.data ?? []).length === 0) return <EmptyState title="No custom requests" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {requests.data!.map((r) => (
        <Card key={r.id} className="border-gold/30 bg-gold/5">
          <div className="font-bold text-sm">{r.product_name}</div>
          <div className="text-[10px] text-muted-foreground mt-1 flex justify-between uppercase">
            <span>By {(r as any).profiles?.display_name}</span>
            <span className="font-black text-gold">{r.status}</span>
          </div>
          {r.note && <p className="mt-2 text-xs text-muted-foreground bg-white/50 p-2 rounded italic">"{r.note}"</p>}
        </Card>
      ))}
    </div>
  );
}

function UserDirectory() {
  const users = useAllProfiles();
  if (users.isLoading) return <div className="text-muted-foreground animate-pulse">Loading users...</div>;
  if ((users.data ?? []).length === 0) return <EmptyState title="No users found" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.data!.map((u) => (
        <Card key={u.id} className="border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
              {u.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-sm leading-none">{u.display_name}</div>
              <div className="text-[9px] text-muted-foreground uppercase mt-1">{u.business_type || 'User'}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Business:</span>
              <span className="font-medium truncate max-w-[120px]">{u.business_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-blue-500/10">
              <span className="text-muted-foreground font-bold">ClipScore:</span>
              <span className={cn(
                "font-bold",
                u.clip_score >= 750 ? "text-emerald-600" :
                u.clip_score >= 650 ? "text-gold" : "text-red-500"
              )}>{u.clip_score}</span>
            </div>
            {u.account_number && (
              <div className="mt-3 p-2 bg-white/50 rounded-lg border border-blue-500/10 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Bank/MoMo:</span>
                  <span className="font-bold">{u.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase">Account:</span>
                  <span className="font-bold tracking-wider">{u.account_number}</span>
                </div>
                <div className="text-muted-foreground italic truncate">{u.account_name}</div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminSupportChat() {
  const { data: allMessages, isLoading } = useAllUserMessages();
  const reply = useReplyToUser();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('admin-support').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
      qc.invalidateQueries({ queryKey: ["all-admin-messages"] });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  if (isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if ((allMessages ?? []).length === 0) return <EmptyState title="No messages" />;

  const grouped = (allMessages ?? []).reduce((acc, m) => {
    if (!acc[m.user_id]) acc[m.user_id] = { profile: (m as any).profiles, messages: [] };
    acc[m.user_id].messages.push(m);
    return acc;
  }, {} as Record<string, { profile: any, messages: any[] }>);

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([userId, data]) => (
        <Card key={userId} className="p-0 border-border/50 overflow-hidden shadow-sm">
          <div className="p-3 bg-muted/20 border-b border-border flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{data.profile?.display_name?.charAt(0) || 'U'}</div>
            <div className="text-xs font-bold">{data.profile?.display_name || "Unknown User"}</div>
          </div>
          <div className="p-4 space-y-3 bg-background/50">
            {data.messages.slice(0, 5).reverse().map((msg: any) => (
              <div key={msg.id} className={cn("max-w-[90%] p-2 rounded-xl text-[11px]", msg.is_from_admin ? "bg-primary/5 self-end ml-auto text-right border border-primary/10" : "bg-muted self-start")}>
                {msg.message}
                <div className="text-[8px] opacity-50 mt-1 uppercase">{format(new Date(msg.created_at), "HH:mm")}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-white flex gap-2">
            <Input value={replyText[userId] ?? ""} onChange={(e) => setReplyText({ ...replyText, [userId]: e.target.value })} placeholder="Reply..." className="h-8 text-xs rounded-lg" />
            <Button size="sm" className="h-8 w-8 p-0 shrink-0" disabled={reply.isPending || !replyText[userId]} onClick={async () => {
              await reply.mutateAsync({ user_id: userId, message: replyText[userId] });
              setReplyText({ ...replyText, [userId]: "" });
              toast.success("Reply sent");
            }}><Send className="w-3.5 h-3.5" /></Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProductManager() {
  const { data: products, isLoading } = useAllProducts();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();
  const [showAdd, setShowAdd] = useState(false);
  const [newP, setNewP] = useState({ name: "", price: "", stock: "10", description: "", image_url: "" });

  if (isLoading) return <div className="h-40 bg-muted animate-pulse rounded-2xl" />;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-sm">Inventory List</h4>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="h-8 text-[10px] uppercase font-black tracking-widest">{showAdd ? "Close" : "Add Product"}</Button>
        </div>
        {showAdd && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            await create.mutateAsync({ ...newP, price: Number(newP.price), stock: Number(newP.stock), active: true });
            setShowAdd(false);
            setNewP({ name: "", price: "", stock: "10", description: "", image_url: "" });
            toast.success("Product added");
          }} className="grid sm:grid-cols-2 gap-3 mb-6 p-4 bg-muted/20 rounded-xl">
            <Input placeholder="Product Name" value={newP.name} onChange={(e) => setNewP({ ...newP, name: e.target.value })} required className="h-9 text-xs" />
            <Input type="number" placeholder="Price (GH₵)" value={newP.price} onChange={(e) => setNewP({ ...newP, price: e.target.value })} required className="h-9 text-xs" />
            <Input type="number" placeholder="Stock" value={newP.stock} onChange={(e) => setNewP({ ...newP, stock: e.target.value })} required className="h-9 text-xs" />
            <Input placeholder="Image URL" value={newP.image_url} onChange={(e) => setNewP({ ...newP, image_url: e.target.value })} className="h-9 text-xs" />
            <Button type="submit" className="sm:col-span-2 h-9 text-xs font-bold" disabled={create.isPending}>Add to Marketplace</Button>
          </form>
        )}
        <ul className="divide-y divide-border">
          {products?.map(p => (
            <li key={p.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">GH₵ {Number(p.price).toLocaleString()}</div>
              </div>
              <Input type="number" min="0" defaultValue={p.stock} className="w-16 h-8 text-xs" onBlur={(e) => {
                const stock = Number(e.target.value);
                if (stock !== p.stock) update.mutate({ id: p.id, stock });
              }} />
              <Button size="sm" variant={p.active ? "outline" : "default"} className="h-7 text-[10px] px-2" onClick={() => update.mutate({ id: p.id, active: !p.active })}>{p.active ? "Hide" : "Show"}</Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Delete ${p.name}?`)) del.mutate(p.id); }}><Trash2 className="w-3 h-3" /></Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
