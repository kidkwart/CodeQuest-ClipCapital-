import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { products, useAddToCart, useCart, useClearCart } from "@/lib/demo-queries";

export const Route = createFileRoute("/_authenticated/demo/market")({
  component: MarketPage,
});

function MarketPage() {
  const { data: cart = [] } = useCart();
  const addToCart = useAddToCart();
  const clearCart = useClearCart();
  const [toast, setToast] = useState<string | null>(null);

  const cartTotal = cart.reduce((s, c) => s + Number(c.price) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  function add(p: typeof products[number]) {
    addToCart.mutate(p, {
      onSuccess: () => {
        setToast(`Added ${p.name}`);
        setTimeout(() => setToast(null), 1500);
      },
    });
  }

  return (
    <div className="pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">ClipMarket</h1>
          <p className="text-xs text-muted-foreground">Supplies from vetted local vendors</p>
        </div>
        {cartCount > 0 && (
          <div className="text-xs rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 font-semibold">
            🛒 {cartCount} · GH₵ {cartTotal.toFixed(0)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl bg-surface-elevated border border-border overflow-hidden flex flex-col">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center text-5xl">
              {p.emoji}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <div className="text-sm font-semibold leading-tight">{p.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.vendor}</div>
              <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="text-sm font-bold text-gold">GH₵ {p.price}</div>
                <button onClick={() => add(p)} disabled={addToCart.isPending} className="text-[10px] rounded-full bg-primary text-primary-foreground font-semibold px-3 py-1.5 disabled:opacity-60">Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider">Order summary</div>
            <button onClick={() => clearCart.mutate()} className="text-[10px] text-muted-foreground">Clear</button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
            <span className="font-bold">GH₵ {cartTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gold">Loyalty points</span>
            <span className="text-gold">+{Math.floor(cartTotal / 10)} pts</span>
          </div>
          <button className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm">Checkout with MoMo</button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-foreground text-background text-xs font-semibold px-4 py-2 shadow-xl z-50">
          {toast} ✓
        </div>
      )}
    </div>
  );
}
