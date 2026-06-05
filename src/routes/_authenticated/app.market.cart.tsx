import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MomoFields, useMomo } from "@/components/momo-form";
import { useCart } from "@/lib/cart";
import { usePlaceOrder, useMyLoans } from "@/lib/app-queries";
import { ArrowLeft, Trash2, Smartphone, Banknote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/app/market/cart")({
  component: Cart,
});

function Cart() {
  const cart = useCart();
  const place = usePlaceOrder();
  const loans = useMyLoans();
  const [momo, setMomo] = useMomo();
  const [payMethod, setPayMethod] = useState<"momo" | "loan">("momo");
  const navigate = useNavigate();
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

  // Find active loans that could be used for BNPL
  const activeLoan = loans.data?.find(l => l.status === "approved" || l.status === "repaying");

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) return;

    if (payMethod === "momo" && !momo.momo_reference) {
      toast.error("MoMo reference required");
      return;
    }

    if (payMethod === "loan" && !activeLoan) {
      toast.error("No active loan found for payment");
      return;
    }

    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: payMethod,
        loan_id: payMethod === "loan" ? activeLoan?.id : undefined,
        ...momo
      });
      cart.clear();
      toast.success(payMethod === "loan" ? "Ordered with Buy Now, Pay Later!" : "Order placed");
      navigate({ to: "/app/orders" });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Checkout">
      <Link to="/app/market" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to market
      </Link>

      {cart.items.length === 0 ? (
        <EmptyState title="Cart is empty" hint="Browse the market and add a product." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="font-display font-bold mb-4">Review Items</h3>
              <ul className="divide-y divide-border">
                {cart.items.map((i) => (
                  <li key={i.product_id} className="py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{i.name}</div>
                      <div className="text-sm text-muted-foreground">GH₵ {i.price.toLocaleString()} unit price</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                      <Input type="number" min="1" value={i.qty} className="w-16 h-8 text-center"
                        onChange={(e) => cart.setQty(i.product_id, Number(e.target.value))} />
                    </div>
                    <div className="w-24 text-right font-bold text-primary">GH₵ {(i.price * i.qty).toLocaleString()}</div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => cart.remove(i.product_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="font-display font-bold mb-4">Payment Method</h3>
              <RadioGroup value={payMethod} onValueChange={(v) => setPayMethod(v as any)} className="space-y-3">
                <div className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="momo" id="momo" />
                  <Label htmlFor="momo" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-600">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">Mobile Money (Instant)</div>
                      <div className="text-xs text-muted-foreground">Pay now via MTN, Vodafone, or AirtelTigo</div>
                    </div>
                  </Label>
                </div>

                <div className={cn(
                  "flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer transition-colors",
                  !activeLoan ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="loan" id="loan" disabled={!activeLoan} />
                  <Label htmlFor="loan" className="flex flex-1 items-center gap-3 cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold flex items-center gap-2">
                        Buy Now, Pay Later
                        {activeLoan && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Active Loan</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeLoan
                          ? "Add this total to your current loan balance"
                          : "You need an active loan to use this feature"}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-20 border-primary/20 bg-surface-elevated">
              <h3 className="font-display font-bold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>GH₵ {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-primary font-bold">FREE</span>
                </div>
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-display text-2xl font-bold text-gold">GH₵ {total.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={checkout} className="space-y-4">
                {payMethod === "momo" && (
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wider">MoMo Instructions</p>
                    <p className="text-xs text-center">Pay total to 0244123456 (ClipCapital Ltd), then enter ID below:</p>
                    <MomoFields value={momo} onChange={setMomo} />
                  </div>
                )}

                {payMethod === "loan" && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" /> Secured BNPL
                    </div>
                    <p className="text-xs text-muted-foreground">This GH₵ {total.toLocaleString()} will be added to your outstanding loan of GH₵ {Number(activeLoan?.balance).toLocaleString()}.</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20" disabled={place.isPending}>
                  {place.isPending ? "Processing..." : payMethod === "loan" ? "Confirm BNPL Order" : "Place MoMo Order"}
                </Button>
              </form>
            </Card>

            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Secure Checkout by ClipCapital</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Helper to handle conditional classes since I can't import cn from utils easily in this context without verification
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
