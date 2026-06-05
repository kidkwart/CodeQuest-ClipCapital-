// Shared in-memory state and seed data for the ClipCapital demo.
import { create } from "zustand";

export type IncomeEntry = { id: string; date: string; amount: number; note: string };
export type ExpenseEntry = { id: string; date: string; amount: number; category: string; note: string };
export type SusuGroup = {
  id: string;
  name: string;
  members: number;
  contribution: number;
  frequency: "Daily" | "Weekly";
  pot: number;
  joined: boolean;
};
export type Product = { id: string; name: string; vendor: string; price: number; emoji: string };

type State = {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  susuGroups: SusuGroup[];
  cart: { productId: string; qty: number }[];
  loanBalance: number;
  clipScore: number;
  addIncome: (amount: number, note: string) => void;
  addExpense: (amount: number, category: string, note: string) => void;
  toggleJoin: (id: string) => void;
  addToCart: (productId: string) => void;
  clearCart: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const useDemo = create<State>((set) => ({
  income: [
    { id: "i1", date: daysAgo(6), amount: 180, note: "12 cuts" },
    { id: "i2", date: daysAgo(5), amount: 220, note: "14 cuts + beard trim" },
    { id: "i3", date: daysAgo(4), amount: 150, note: "Slow day" },
    { id: "i4", date: daysAgo(3), amount: 260, note: "Weekend rush" },
    { id: "i5", date: daysAgo(2), amount: 310, note: "Saturday" },
    { id: "i6", date: daysAgo(1), amount: 195, note: "Sunday" },
    { id: "i7", date: today(), amount: 140, note: "Morning shift" },
  ],
  expenses: [
    { id: "e1", date: daysAgo(5), amount: 25, category: "Supplies", note: "Razor blades" },
    { id: "e2", date: daysAgo(3), amount: 60, category: "Electricity", note: "ECG top-up" },
    { id: "e3", date: daysAgo(1), amount: 40, category: "Supplies", note: "Hair oil, talc" },
  ],
  susuGroups: [
    { id: "s1", name: "Madina Barbers Circle", members: 12, contribution: 20, frequency: "Daily", pot: 3200, joined: true },
    { id: "s2", name: "Tema Stylists Susu", members: 8, contribution: 50, frequency: "Weekly", pot: 1800, joined: false },
    { id: "s3", name: "Kaneshie Cut Crew", members: 15, contribution: 10, frequency: "Daily", pot: 4500, joined: false },
  ],
  cart: [],
  loanBalance: 1200,
  clipScore: 712,
  addIncome: (amount, note) =>
    set((s) => ({
      income: [...s.income, { id: crypto.randomUUID(), date: today(), amount, note }],
      clipScore: Math.min(850, s.clipScore + 1),
    })),
  addExpense: (amount, category, note) =>
    set((s) => ({
      expenses: [...s.expenses, { id: crypto.randomUUID(), date: today(), amount, category, note }],
    })),
  toggleJoin: (id) =>
    set((s) => ({
      susuGroups: s.susuGroups.map((g) => (g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g)),
    })),
  addToCart: (productId) =>
    set((s) => {
      const existing = s.cart.find((c) => c.productId === productId);
      return existing
        ? { cart: s.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c)) }
        : { cart: [...s.cart, { productId, qty: 1 }] };
    }),
  clearCart: () => set({ cart: [] }),
}));

export const products: Product[] = [
  { id: "p1", name: "Wahl Pro Clipper", vendor: "Accra Barber Supply", price: 850, emoji: "✂️" },
  { id: "p2", name: "Salon Hair Dryer 2000W", vendor: "Madina Beauty Hub", price: 420, emoji: "💨" },
  { id: "p3", name: "Cape & Apron Set", vendor: "Tema Trade Co.", price: 95, emoji: "🧥" },
  { id: "p4", name: "Premium Shaving Foam", vendor: "Kaneshie Pro Goods", price: 35, emoji: "🪒" },
  { id: "p5", name: "Hot Towel Warmer", vendor: "Accra Barber Supply", price: 280, emoji: "♨️" },
  { id: "p6", name: "Salon Mirror w/ LED", vendor: "Madina Beauty Hub", price: 540, emoji: "🪞" },
];
