import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProduct, useMyProducts, useMyRoles, useProducts, useGrantRole } from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

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
  const myProducts = useMyProducts();
  const roles = useMyRoles();
  const isVendor = roles.data?.includes("vendor");
  const grant = useGrantRole();
  const { user } = useCurrentUser();
  const cart = useCart();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("1");

  async function becomeVendor() {
    if (!user) return;
    try { await grant.mutateAsync({ user_id: user.id, role: "vendor" }); toast.success("You're a vendor"); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(price); const s = Number(stock);
    if (!name.trim() || !p) { toast.error("Name and price required"); return; }
    try {
      await createProduct.mutateAsync({ name, description, price: p, image_url: imageUrl, stock: s });
      setName(""); setDescription(""); setPrice(""); setImageUrl(""); setStock("1");
      toast.success("Product listed");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Marketplace">
      <div className="flex justify-end mb-4">
        <Link to="/app/market/cart" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
          <ShoppingCart className="w-4 h-4" /> Cart ({cart.items.length})
        </Link>
      </div>

      {(products.data ?? []).length === 0 ? (
        <EmptyState title="No products yet" hint="Vendors haven't listed any items. Become a vendor below to list yours." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.data!.map((p) => (
            <Card key={p.id}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full h-32 rounded-lg bg-surface-elevated mb-3" />
              )}
              <div className="font-display font-bold">{p.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="font-bold text-gold">GH₵ {Number(p.price).toLocaleString()}</div>
                <Button size="sm" disabled={p.stock <= 0} onClick={() => {
                  cart.add({ product_id: p.id, vendor_id: p.vendor_id, name: p.name, price: Number(p.price), qty: 1 });
                  toast.success("Added to cart");
                }}>Add</Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{p.stock} in stock</div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="font-display font-semibold mt-10 mb-3">Sell on ClipMarket</h3>
      {!isVendor ? (
        <Card>
          <p className="text-sm text-muted-foreground">Become a vendor to list your products to all ClipCapital users.</p>
          <Button className="mt-3" onClick={becomeVendor} disabled={grant.isPending}>Become a vendor</Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h4 className="font-display font-semibold mb-3">List a new product</h4>
            <form onSubmit={submitProduct} className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (GH₵)</Label><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                <div><Label>Stock</Label><Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
              </div>
              <div><Label>Image URL</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
              <Button type="submit" disabled={createProduct.isPending} className="w-full">List product</Button>
            </form>
          </Card>
          <Card>
            <h4 className="font-display font-semibold mb-3">My listings</h4>
            {(myProducts.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {myProducts.data!.map((p) => (
                  <li key={p.id} className="py-2 flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-semibold">GH₵ {Number(p.price).toLocaleString()} · {p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
