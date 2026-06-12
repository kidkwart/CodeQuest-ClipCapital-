import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMyRoles, usePendingLoans, useReviewLoan,
  useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useAllProductRequests, useAllOrders, useUpdateOrderStatus, useAllProfiles,
  useAdminStats, useAllUserMessages, useReplyToUser
} from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Trash2, Loader2, Banknote, MessageSquarePlus, ShieldCheck, Package, ExternalLink, Users, TrendingUp, MessageCircle, Send } from "lucide-react";
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

  // Wait for both roles and user info to load
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

  if (!isAdmin) {
    console.log("Not admin, redirecting. Email:", user?.email, "Roles:", roles.data);
    return <Navigate to="/app" />;
  }

  return (
    <AppShell title="Admin Control Center">
      <div className="space-y-12 pb-20">
        {/* 1. Daily Performance */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-xl uppercase tracking-tight">System Health</h3>
          </div>
          <DailyReport />
        </section>

        {/* 2. Urgent Queues */}
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
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Order Management</h3>
            </div>
            <OrderQueue />
          </section>
        </div>

        {/* 3. Product Requests */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquarePlus className="w-5 h-5 text-gold" />
            <h3 className="font-display font-bold text-xl">Custom Requests</h3>
          </div>
          <ProductRequestQueue />
        </section>

        {/* 4. User Base & Support */}
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

        {/* 5. Inventory */}
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

function OrderQueue() {
  const orders = useAllOrders();
  const updateStatus = useUpdateOrderStatus();

  if (orders.isLoading) return <div className="text-muted-foreground animate-pulse">Loading orders...</div>;
  if ((orders.data ?? []).length === 0) return <EmptyState title="No orders yet" hint="Customers haven't purchased any items." />;

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
              <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">
                Details
              </Button>
            </div>
          </div>
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
          </div>
        </Card>
      ))}
    </div>
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

function ProductRequestQueue() {
  const requests = useAllProductRequests();

  if (requests.isLoading) return <div className="text-muted-foreground animate-pulse">Loading requests...</div>;
  if ((requests.data ?? []).length === 0) return <EmptyState title="No requests yet" hint="Users haven't requested any custom items." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.data!.map((r) => {
        const profile = (r as any).profiles;
        return (
          <Card key={r.id} className="border-gold/20 bg-gold/5">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-base">{r.product_name}</div>
              <div className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold uppercase">{r.status}</div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              By <span className="font-bold text-foreground">{profile?.display_name || "Unknown"}</span>
            </div>
            {r.estimated_price && <div className="text-sm font-semibold mb-1">Target: GH₵ {r.estimated_price}</div>}
            {r.note && <div className="text-[11px] bg-background p-2 rounded border border-gold/10 italic">"{r.note}"</div>}
          </Card>
        );
      })}
    </div>
  );
}

function ProductManager() {
  const list = useAllProducts();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "", stock: "1" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price); const stock = Number(form.stock);
    if (!form.name.trim() || !price) { toast.error("Name and price required"); return; }
    try {
      await create.mutateAsync({ name: form.name, description: form.description, price, image_url: form.image_url, stock });
      setForm({ name: "", description: "", price: "", image_url: "", stock: "1" });
      toast.success("Product added");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card>
        <h4 className="font-display font-semibold mb-3">Add product</h4>
        <form onSubmit={add} className="space-y-3">
          <div><Label className="text-[10px]">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-9 text-sm" /></div>
          <div><Label className="text-[10px]">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[10px]">Price (GH₵)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="h-9 text-sm" /></div>
            <div><Label className="text-[10px]">Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="h-9 text-sm" /></div>
          </div>
          <div><Label className="text-[10px]">Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className="h-9 text-sm" /></div>
          <Button type="submit" disabled={create.isPending} className="w-full">Add product</Button>
        </form>
      </Card>
      <Card className="lg:col-span-2">
        <h4 className="font-display font-semibold mb-3">All products ({list.data?.length ?? 0})</h4>
        {(list.data ?? []).length === 0 ? (
          <EmptyState title="No products" />
        ) : (
          <ul className="divide-y divide-border max-h-[400px] overflow-y-auto pr-2">
            {list.data!.map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[10px]">No Img</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-sm">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">GH₵ {Number(p.price).toLocaleString()}</div>
                </div>
                <Input type="number" min="0" defaultValue={p.stock} className="w-16 h-8 text-xs"
                  onBlur={(e) => {
                    const stock = Number(e.target.value);
                    if (stock !== p.stock) update.mutate({ id: p.id, stock });
                  }} />
                <Button size="sm" variant={p.active ? "outline" : "default"} className="h-7 text-[10px] px-2"
                  onClick={() => update.mutate({ id: p.id, active: !p.active })}>
                  {p.active ? "Hide" : "Show"}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                  if (confirm(`Delete ${p.name}?`)) del.mutate(p.id);
                }}><Trash2 className="w-3 h-3" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function LoanQueue() {
  const list = usePendingLoans();
  const review = useReviewLoan();
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [interestById, setInterestById] = useState<Record<string, string>>({});

  if ((list.data ?? []).length === 0) return <EmptyState title="No applications" />;

  return (
    <div className="space-y-4">
      {list.data!.map((l) => {
        const profile = (l as { profiles?: { display_name?: string; business_name?: string } | null }).profiles;
        return (
          <Card key={l.id} className="border-primary/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-display font-bold text-base">{profile?.display_name ?? "User"}</div>
                <div className="text-[11px] text-muted-foreground">{profile?.business_name ?? "Independent Professional"}</div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase font-black">Request</div>
                    <div className="font-bold text-lg">GH₵ {Number(l.amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase font-black">Term</div>
                    <div className="font-bold">{l.term_months} Months</div>
                  </div>
                </div>

                <div className="mt-3 text-xs p-2 bg-muted/30 rounded border border-border/50">
                  <span className="text-muted-foreground font-bold">Purpose:</span> {l.purpose}
                </div>
              </div>
            </div>

            {l.status === "pending" && (
              <div className="mt-6 space-y-4 border-t border-dashed border-border pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Interest (%)</Label>
                    <Input
                      type="number"
                      placeholder="15.0"
                      step="0.1"
                      className="h-8 text-xs"
                      value={interestById[l.id] ?? "15.0"}
                      onChange={(e) => setInterestById({ ...interestById, [l.id]: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Note</Label>
                    <Input
                      placeholder="Reason"
                      className="h-8 text-xs"
                      value={noteById[l.id] ?? ""}
                      onChange={(e) => setNoteById({ ...noteById, [l.id]: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 h-9 text-[10px] font-bold"
                    disabled={review.isPending}
                    onClick={async () => {
                      try {
                        const promise = review.mutateAsync({
                          id: l.id,
                          status: "approved",
                          decision_note: noteById[l.id] ?? "",
                          interest_rate: Number(interestById[l.id] ?? 15.0)
                        });
                        toast.promise(promise, {
                          loading: 'Processing MoMo Payout...',
                          success: 'Loan Approved!',
                          error: 'Payout failed.',
                        });
                        await promise;
                      } catch (e) { /* error handled by toast */ }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-destructive text-destructive h-9 text-[10px] font-bold"
                    disabled={review.isPending}
                    onClick={async () => {
                      try {
                        await review.mutateAsync({
                          id: l.id,
                          status: "rejected",
                          decision_note: noteById[l.id] ?? ""
                        });
                        toast.success("Application Rejected");
                      } catch (e) { toast.error((e as Error).message); }
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {l.status !== "pending" && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 rounded-full">{l.status}</span>
                {l.decision_note && <div className="text-[10px] italic text-muted-foreground">"{l.decision_note}"</div>}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AdminSupportChat() {
  const { data: allMessages, isLoading } = useAllUserMessages();
  const reply = useReplyToUser();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-support')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
        qc.invalidateQueries({ queryKey: ["all-admin-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  if (isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if ((allMessages ?? []).length === 0) return <EmptyState title="No messages" />;

  // Group messages by user
  const grouped = (allMessages ?? []).reduce((acc, m) => {
    if (!acc[m.user_id]) acc[m.user_id] = {
      profile: (m as any).profiles,
      messages: []
    };
    acc[m.user_id].messages.push(m);
    return acc;
  }, {} as Record<string, { profile: any, messages: any[] }>);

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([userId, data]) => (
        <Card key={userId} className="p-0 border-border/50 overflow-hidden shadow-sm">
          <div className="p-3 bg-muted/20 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {data.profile?.display_name?.charAt(0) || 'U'}
              </div>
              <div className="text-xs font-bold">{data.profile?.display_name || "Unknown User"}</div>
            </div>
          </div>

          <div className="p-4 space-y-3 bg-background/50">
            {data.messages.slice(0, 5).reverse().map((msg: any) => (
              <div key={msg.id} className={cn(
                "max-w-[90%] p-2 rounded-xl text-[11px]",
                msg.is_from_admin ? "bg-primary/5 self-end ml-auto text-right border border-primary/10" : "bg-muted self-start"
              )}>
                {msg.message}
                <div className="text-[8px] opacity-50 mt-1 uppercase">{format(new Date(msg.created_at), "HH:mm")}</div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border bg-white flex gap-2">
            <Input
              value={replyText[userId] ?? ""}
              onChange={(e) => setReplyText({ ...replyText, [userId]: e.target.value })}
              placeholder="Reply..."
              className="h-8 text-xs rounded-lg"
            />
            <Button
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              disabled={reply.isPending || !replyText[userId]}
              onClick={async () => {
                await reply.mutateAsync({ user_id: userId, message: replyText[userId] });
                setReplyText({ ...replyText, [userId]: "" });
                toast.success("Reply sent");
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
