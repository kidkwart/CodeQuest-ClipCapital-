import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMyRoles, usePendingLoans, useReviewLoan,
  useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
} from "@/lib/app-queries";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/admin")({
  component: Admin,
});

function Admin() {
  const roles = useMyRoles();
  if (roles.isLoading) return <AppShell title="Admin"><div className="text-muted-foreground">Loading…</div></AppShell>;
  if (!roles.data?.includes("admin")) return <Navigate to="/app" />;

  return (
    <AppShell title="Admin">
      <h3 className="font-display font-semibold mb-3">Loan applications</h3>
      <LoanQueue />
      <h3 className="font-display font-semibold mt-10 mb-3">Marketplace products</h3>
      <ProductManager />
    </AppShell>
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

  if ((list.data ?? []).length === 0) return <EmptyState title="No applications" />;

  return (
    <div className="space-y-3">
      {list.data!.map((l) => {
        const profile = (l as { profiles?: { display_name?: string; business_name?: string } | null }).profiles;
        return (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display font-bold">{profile?.display_name ?? "User"} <span className="text-xs text-muted-foreground">({profile?.business_name ?? "—"})</span></div>
                <div className="text-sm mt-1">GH₵ {Number(l.amount).toLocaleString()} · {l.term_months}mo · {l.purpose}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()}</div>
                <div className="text-xs font-bold uppercase mt-1 text-primary">{l.status}</div>
              </div>
            </div>
            {l.status === "pending" && (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <Label className="text-xs">Decision note (optional)</Label>
                <Input value={noteById[l.id] ?? ""} onChange={(e) => setNoteById({ ...noteById, [l.id]: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={review.isPending} onClick={async () => {
                    try { await review.mutateAsync({ id: l.id, status: "approved", decision_note: noteById[l.id] ?? "" }); toast.success("Approved"); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={review.isPending} onClick={async () => {
                    try { await review.mutateAsync({ id: l.id, status: "rejected", decision_note: noteById[l.id] ?? "" }); toast.success("Rejected"); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>Reject</Button>
                </div>
              </div>
            )}
            {l.decision_note && <div className="mt-2 text-xs italic text-muted-foreground">Note: {l.decision_note}</div>}
          </Card>
        );
      })}
    </div>
  );
}
