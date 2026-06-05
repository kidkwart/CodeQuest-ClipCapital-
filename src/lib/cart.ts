import { useEffect, useState } from "react";
import type { CartItem } from "./app-queries";

const KEY = "clipcapital_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-changed"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const handler = () => setItems(read());
    window.addEventListener("cart-changed", handler);
    return () => window.removeEventListener("cart-changed", handler);
  }, []);

  return {
    items,
    add(item: CartItem) {
      const next = [...read()];
      const idx = next.findIndex((i) => i.product_id === item.product_id);
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
      } else {
        next.push(item);
      }
      write(next);
      setItems(next); // Force immediate local update
    },
    remove(productId: string) {
      const next = read().filter((i) => i.product_id !== productId);
      write(next);
      setItems(next);
    },
    setQty(productId: string, qty: number) {
      const next = read().map((i) => i.product_id === productId ? { ...i, qty } : i).filter((i) => i.qty > 0);
      write(next);
      setItems(next);
    },
    clear() {
      write([]);
      setItems([]);
    },
    total() { return read().reduce((s, i) => s + i.price * i.qty, 0); },
  };
}
