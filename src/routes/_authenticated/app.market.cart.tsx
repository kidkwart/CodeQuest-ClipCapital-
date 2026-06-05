import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MomoFields, useMomo } from "@/components/momo-form";
import { useCart } from "@/lib/cart";
import { usePlaceOrder } from "@/lib/app-queries";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/market/cart")({
  component: Cart,
});

function Cart() {
  const cart = useCart();
  const place = usePlaceOrder();
  const [momo, setMomo] = useMomo();
  const navigate = useNavigate();
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) return;
    if (!momo.momo_reference) { toast.error("MoMo reference required"); return; }
    try {
      await place.mutateAsync({ items: cart.items, ...momo });
      cart.clear();
      toast.success("Order placed");
      navigate({ to: "/app/orders" });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Cart">
      <Link to="/app/market" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to market
      </Link>
      {cart.items.length === 0 ? (
        <EmptyState title="Cart is empty" hint="Browse the market and add a product." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <ul className="divide-y divide-border">
              {cart.items.map((i) => (
                <li key={i.product_id} className="py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{i.name}</div>
                    <div className="text-xs text-muted-foreground">GH₵ {i.price.toLocaleString()} each</div>
                  </div>
                  <Input type="number" min="1" value={i.qty} className="w-20"
                    onChange={(e) => cart.setQty(i.product_id, Number(e.target.value))} />
                  <div className="w-24 text-right font-bold">GH₵ {(i.price * i.qty).toLocaleString()}</div>
                  <Button variant="ghost" size="icon" onClick={() => cart.remove(i.product_id)}><Trash2 className="w-4 h-4" /></Button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex justify-between mb-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-xl font-bold">GH₵ {total.toLocaleString()}</span>
            </div>
            <form onSubmit={checkout} className="space-y-3">
              <p className="text-xs text-muted-foreground">Send the total via mobile money, then enter the transaction reference below.</p>
              <MomoFields value={momo} onChange={setMomo} />
              <Button type="submit" className="w-full" disabled={place.isPending}>
                {place.isPending ? "Placing order…" : "Place order"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
