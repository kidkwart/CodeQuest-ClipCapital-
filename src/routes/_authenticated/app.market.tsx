import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts, useCreateProductRequest, useMyProductRequests } from "@/lib/app-queries";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingCart, CheckCircle, ShieldCheck, MessageSquarePlus, Clock, Sparkles, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/app/market")({
  component: MarketLayout,
});

function MarketLayout() {
  const matchRoute = useMatchRoute();
  const onCart = matchRoute({ to: "/app/market/cart" });
  if (onCart) return <Outlet />;
  return <Market />;
}

function Market() {
  const products = useProducts();
  const cart = useCart();
  const createRequest = useCreateProductRequest();
  const myRequests = useMyProductRequests();
  const [open, setOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", price: "", note: "" });
  const [activeCategory, setActiveCategory] = useState("All");
  const [addingId, setAddingId] = useState<string | null>(null);

  const categories = ["All", "Electricals", "Liquids", "Accessories"];

  const filteredProducts = products.data?.filter(p =>
    activeCategory === "All" || (p as any).category === activeCategory
  );

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestForm.name.trim()) return;
    try {
      await createRequest.mutateAsync({
        product_name: requestForm.name,
        estimated_price: requestForm.price ? Number(requestForm.price) : undefined,
        note: requestForm.note,
      });
      toast.success("Request sent to ClipCapital Team!");
      setRequestForm({ name: "", price: "", note: "" });
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  }

  const addToCart = (p: any) => {
    try {
      if (!p.id || !p.vendor_id) {
        toast.error("Product configuration error.");
        return;
      }

      // Visual feedback state
      setAddingId(p.id);
      setTimeout(() => setAddingId(null), 1000);

      cart.add({
        product_id: p.id,
        vendor_id: p.vendor_id,
        name: p.name,
        price: Number(p.price),
        qty: 1
      });

      toast.success(`${p.name} added to cart`);
    } catch (err) {
      console.error("Cart error:", err);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <AppShell title="ClipMarket">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            Premium Shop <Sparkles className="w-5 h-5 text-gold animate-pulse" />
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Directly from ClipCapital — Quality Guaranteed
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none gap-2 rounded-full px-5 border-primary/30 hover:bg-primary/5">
                <MessageSquarePlus className="w-4 h-4" /> Request Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Can't find what you need?</DialogTitle>
                <DialogDescription>
                  Tell us what product you want ClipCapital to stock next. We'll source it at the best price for you.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequest} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>What is the product name?</Label>
                  <Input
                    placeholder="e.g. Cordless Detailers, Neutralizing Shampoo"
                    value={requestForm.name}
                    onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated Price (GH₵ - optional)</Label>
                  <Input
                    type="number"
                    placeholder="How much do you usually pay?"
                    value={requestForm.price}
                    onChange={(e) => setRequestForm({ ...requestForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Extra Details</Label>
                  <Input
                    placeholder="Brand preference, size, etc."
                    value={requestForm.note}
                    onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/app/market/cart" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 transition-transform relative h-10 min-w-[100px]">
              <ShoppingCart className="w-4 h-4" /> Cart
              <AnimatePresence>
                {cart.items.length > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] text-white font-bold ring-2 ring-background shadow-sm"
                  >
                    {cart.items.reduce((s, i) => s + i.qty, 0)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="rounded-full px-5 h-9"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Mini Status Bar for Requests */}
      {myRequests.data && myRequests.data.length > 0 && (
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar border-b border-border/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase flex-shrink-0">My Requests:</div>
          {myRequests.data.slice(0, 3).map(r => (
            <div key={r.id} className="flex-shrink-0 flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-full text-[10px]">
              <Clock className="w-3 h-3 text-gold" />
              <span className="font-semibold text-muted-foreground uppercase">{r.status}:</span>
              <span className="font-bold">{r.product_name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-gold/10 border border-primary/20 flex items-center gap-4 shadow-sm">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-sm">Official Supply Store</div>
          <p className="text-xs text-muted-foreground font-medium">We source the best tools directly. Add items to your cart and pay via MoMo or with your active Loan.</p>
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (filteredProducts ?? []).length === 0 ? (
        <EmptyState title="Nothing found" hint="We don't have items in this category yet. Try another one!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts!.map((p) => {
            const isAdding = addingId === p.id;
            return (
              <Card key={p.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="relative aspect-[4/3] -mx-5 -mt-5 mb-4 overflow-hidden bg-surface-elevated">
                  <img
                    src={p.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 flex gap-1">
                    <div className="bg-background/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-primary flex items-center gap-1 border border-primary/20">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </div>
                    {p.is_featured && (
                      <div className="bg-gold/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                        BEST SELLER
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="font-display font-bold text-lg leading-tight">{p.name}</div>
                  <div className="text-[10px] bg-muted px-2 py-0.5 rounded uppercase font-bold text-muted-foreground whitespace-nowrap">{(p as any).category}</div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px] leading-relaxed">{p.description}</div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Price</div>
                    <div className="font-bold text-xl text-gold">GH₵ {Number(p.price).toLocaleString()}</div>
                  </div>

                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      disabled={p.stock <= 0 || isAdding}
                      className={cn(
                        "rounded-full px-6 h-10 shadow-md gap-2 transition-all duration-300",
                        isAdding ? "bg-emerald-500 hover:bg-emerald-500" : ""
                      )}
                      onClick={() => addToCart(p)}
                    >
                      {isAdding ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Added
                        </motion.div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                  <span className={p.stock < 5 ? "text-red-500 font-bold" : "font-medium"}>
                    {p.stock} units available
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <footer className="mt-16 text-center text-muted-foreground pb-8 border-t border-border/50 pt-8">
        <div className="flex justify-center gap-8 mb-4 text-primary">
          <div className="flex flex-col items-center">
            <div className="font-bold text-lg">24h</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Delivery</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-bold text-lg">100%</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Genuine</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-bold text-lg">MoMo</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Payment</div>
          </div>
        </div>
        <p className="text-xs italic font-medium">Only genuine supplies. Backed by ClipCapital Financial Support.</p>
      </footer>
    </AppShell>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
