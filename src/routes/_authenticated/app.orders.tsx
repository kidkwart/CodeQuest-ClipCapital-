import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { useMyOrders } from "@/lib/app-queries";

export const Route = createFileRoute("/_authenticated/app/orders")({
  component: Orders,
});

function Orders() {
  const list = useMyOrders();
  return (
    <AppShell title="My Orders">
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="No orders yet" hint="Place an order from the marketplace." />
      ) : (
        <div className="space-y-3">
          {list.data!.map((o) => {
            const items = (o as { order_items?: Array<{ id: string; qty: number; price: number; products?: { name?: string } | null }> }).order_items ?? [];
            return (
              <Card key={o.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                    <div className="font-mono text-xs text-muted-foreground mt-1">{o.momo_provider.toUpperCase()} · {o.momo_reference}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">GH₵ {Number(o.total).toLocaleString()}</div>
                    <div className="text-xs font-bold uppercase text-primary">{o.status}</div>
                  </div>
                </div>
                <ul className="mt-3 text-sm divide-y divide-border">
                  {items.map((it) => (
                    <li key={it.id} className="py-1 flex justify-between">
                      <span>{it.products?.name ?? "Item"} × {it.qty}</span>
                      <span>GH₵ {(Number(it.price) * it.qty).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
