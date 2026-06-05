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
  useAdminStats,
} from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Trash2, Loader2, Banknote, MessageSquarePlus, ShieldCheck, ShoppingCart, Package, ExternalLink, Users, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="flex items-center gap-2 text-muted-foreground">
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
      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-xl">Daily Business Report</h3>
          </div>
          <DailyReport />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Incoming Orders</h3>
            </div>
          </div>
          <OrderQueue />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-xl">User Directory</h3>
          </div>
          <UserDirectory />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl">Loan Applications</h3>
          </div>
          <LoanQueue />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Incoming Orders</h3>
            </div>
          </div>
          <OrderQueue />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-xl">User Directory</h3>
          </div>
          <UserDirectory />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquarePlus className="w-5 h-5 text-gold" />
            <h3 className="font-display font-bold text-xl">User Product Requests</h3>
          </div>
          <ProductRequestQueue />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-xl">Incoming Orders</h3>
            </div>
          </div>
          <OrderQueue />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-xl">User Directory</h3>
          </div>
          <UserDirectory />
        </section>

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
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-bold text-lg">Order #{o.id.slice(0, 8)}</div>
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  o.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                  o.status === "delivered" ? "bg-blue-500/10 text-blue-600" :
                  "bg-orange-500/10 text-orange-600"
                )}>
                  {o.status}
                </div>
              </div>
              <div className="text-sm mb-4">
                Customer: <span className="font-semibold">{(o as any).profiles?.display_name}</span>
                <span className="text-muted-foreground italic"> ({(o as any).profiles?.business_name})</span>
              </div>
              <div className="space-y-1">
                {(o as any).order_items?.map((item: any) => (
                  <div key={item.id} className="text-sm flex justify-between max-w-md">
                    <span>{item.qty}x {item.products?.name}</span>
                    <span className="text-muted-foreground">GH₵ {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:text-right md:min-w-[200px]">
              <div className="text-2xl font-display font-bold text-gold">GH₵ {Number(o.total).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mb-4">
                Paid via: <span className="font-bold uppercase">{o.payment_method || 'momo'}</span>
                {o.momo_reference && <div className="mt-0.5">Ref: <code className="bg-muted px-1 rounded">{o.momo_reference}</code></div>}
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {o.status === "pending" && (
                  <Button size="sm" className="bg-emerald-600" onClick={() => updateStatus.mutate({ id: o.id, status: "paid" })}>
                    Mark Paid
                  </Button>
                )}
                {o.status === "paid" && (
                  <Button size="sm" className="bg-blue-600" onClick={() => updateStatus.mutate({ id: o.id, status: "delivered" })}>
                    Mark Delivered
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1">
                  Details <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.data!.map((u) => (
        <Card key={u.id} className="border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
              {u.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-sm">{u.display_name}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{u.business_type}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Business:</span>
              <span className="font-medium truncate max-w-[120px]">{u.business_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{u.location || 'N/A'}</span>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="font-bold text-lg">{r.product_name}</div>
              <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold uppercase">{r.status}</div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Requested by <span className="font-bold text-foreground">{profile?.display_name || "Unknown"}</span>
              {profile?.business_name && <span className="italic"> ({profile.business_name})</span>}
            </div>
            {r.estimated_price && <div className="text-sm font-semibold mb-1">Target Price: GH₵ {r.estimated_price}</div>}
            {r.note && <div className="text-xs bg-background p-2 rounded border border-gold/10 italic">"{r.note}"</div>}
            <div className="mt-3 text-[10px] text-muted-foreground uppercase">{new Date(r.created_at).toLocaleDateString()}</div>
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
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price (GH₵)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <div><Label>Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
          <Button type="submit" disabled={create.isPending} className="w-full">Add product</Button>
        </form>
      </Card>
      <Card className="lg:col-span-2">
        <h4 className="font-display font-semibold mb-3">All products ({list.data?.length ?? 0})</h4>
        {(list.data ?? []).length === 0 ? (
          <EmptyState title="No products" />
        ) : (
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {list.data!.map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 rounded bg-surface-elevated" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">GH₵ {Number(p.price).toLocaleString()}</div>
                </div>
                <Input type="number" min="0" defaultValue={p.stock} className="w-20"
                  onBlur={(e) => {
                    const stock = Number(e.target.value);
                    if (stock !== p.stock) update.mutate({ id: p.id, stock });
                  }} />
                <Button size="sm" variant={p.active ? "outline" : "default"}
                  onClick={() => update.mutate({ id: p.id, active: !p.active })}>
                  {p.active ? "Hide" : "Show"}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => {
                  if (confirm(`Delete ${p.name}?`)) del.mutate(p.id);
                }}><Trash2 className="w-4 h-4" /></Button>
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
    <div className="space-y-3">
      {list.data!.map((l) => {
        const profile = (l as { profiles?: { display_name?: string; business_name?: string } | null }).profiles;
        return (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-display font-bold text-lg">{profile?.display_name ?? "User"}</div>
                <div className="text-sm text-muted-foreground">{profile?.business_name ?? "Independent Professional"}</div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Request</div>
                    <div className="font-bold">GH₵ {Number(l.amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Term</div>
                    <div className="font-bold">{l.term_months} Months</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Status</div>
                    <div className="font-bold text-primary uppercase text-[10px]">{l.status}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Applied</div>
                    <div className="font-bold text-[10px]">{new Date(l.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Purpose:</span> {l.purpose}
                </div>
              </div>
            </div>

            {l.status === "pending" && (
              <div className="mt-6 space-y-4 border-t border-border pt-4 bg-muted/20 -mx-5 px-5 pb-4 rounded-b-xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Interest Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="5.0"
                      step="0.1"
                      value={interestById[l.id] ?? "5.0"}
                      onChange={(e) => setInterestById({ ...interestById, [l.id]: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Decision Note</Label>
                    <Input
                      placeholder="Reason for approval/rejection"
                      value={noteById[l.id] ?? ""}
                      onChange={(e) => setNoteById({ ...noteById, [l.id]: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={review.isPending}
                    onClick={async () => {
                      try {
                        const promise = review.mutateAsync({
                          id: l.id,
                          status: "approved",
                          decision_note: noteById[l.id] ?? "",
                          interest_rate: Number(interestById[l.id] ?? 5.0)
                        });
                        toast.promise(promise, {
                          loading: 'Processing MoMo Payout...',
                          success: 'Loan Approved & GH₵ ' + l.amount + ' Sent!',
                          error: 'Payout failed. Please try again.',
                        });
                        await promise;
                      } catch (e) { /* error handled by toast */ }
                    }}
                  >
                    {review.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Approve & Disburse
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
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
                    Reject Application
                  </Button>
                </div>
              </div>
            )}

            {l.status !== "pending" && l.decision_note && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm italic text-muted-foreground border-l-2 border-primary/30">
                <span className="font-semibold not-italic">Admin Note:</span> {l.decision_note}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
