import { useEffect, useState } from "react";
import type { CartItem } from "./app-queries";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "clipcapital_cart_v1";
let listeners: (() => void)[] = [];

async function read(): Promise<CartItem[]> {
  try {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(KEY)
      : await AsyncStorage.getItem(KEY);
    return JSON.parse(raw ?? "[]");
  } catch {
    return [];
  }
}

async function write(items: CartItem[]) {
  const data = JSON.stringify(items);
  if (Platform.OS === 'web') {
    localStorage.setItem(KEY, data);
  } else {
    await AsyncStorage.setItem(KEY, data);
  }
  listeners.forEach(l => l());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const load = async () => setItems(await read());
    load();
    listeners.push(load);
    return () => {
      listeners = listeners.filter(l => l !== load);
    };
  }, []);

  return {
    items,
    async add(item: CartItem) {
      const current = await read();
      const next = [...current];
      const idx = next.findIndex((i) => i.product_id === item.product_id);
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
      } else {
        next.push(item);
      }
      await write(next);
    },
    async remove(productId: string) {
      const current = await read();
      const next = current.filter((i) => i.product_id !== productId);
      await write(next);
    },
    async setQty(productId: string, qty: number) {
      const current = await read();
      const next = current.map((i) => i.product_id === productId ? { ...i, qty } : i).filter((i) => i.qty > 0);
      await write(next);
    },
    async clear() {
      await write([]);
    },
  };
}
