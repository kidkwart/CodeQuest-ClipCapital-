// Query hooks + helpers backed by Lovable Cloud, scoped to the signed-in user.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = { id: string; name: string; vendor: string; price: number; emoji: string };

export const products: Product[] = [
  { id: "p1", name: "Wahl Pro Clipper", vendor: "Accra Barber Supply", price: 850, emoji: "✂️" },
  { id: "p2", name: "Salon Hair Dryer 2000W", vendor: "Madina Beauty Hub", price: 420, emoji: "💨" },
  { id: "p3", name: "Cape & Apron Set", vendor: "Tema Trade Co.", price: 95, emoji: "🧥" },
  { id: "p4", name: "Premium Shaving Foam", vendor: "Kaneshie Pro Goods", price: 35, emoji: "🪒" },
  { id: "p5", name: "Hot Towel Warmer", vendor: "Accra Barber Supply", price: 280, emoji: "♨️" },
  { id: "p6", name: "Salon Mirror w/ LED", vendor: "Madina Beauty Hub", price: 540, emoji: "🪞" },
];

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIncome() {
  return useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_entries")
        .select("*")
        .order("entry_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; note: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("income_entries").insert({
        user_id: u.user.id,
        amount: input.amount,
        note: input.note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_entries")
        .select("*")
        .order("entry_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; category: string; note: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("expense_entries").insert({
        user_id: u.user.id,
        amount: input.amount,
        category: input.category,
        note: input.note,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useSusu() {
  return useQuery({
    queryKey: ["susu"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const [{ data: groups, error: gErr }, { data: mine, error: mErr }] = await Promise.all([
        supabase.from("susu_groups").select("*").order("name"),
        u.user
          ? supabase.from("susu_memberships").select("group_id").eq("user_id", u.user.id)
          : Promise.resolve({ data: [], error: null } as { data: { group_id: string }[]; error: null }),
      ]);
      if (gErr) throw gErr;
      if (mErr) throw mErr;
      const joined = new Set((mine ?? []).map((m) => m.group_id));
      return (groups ?? []).map((g) => ({ ...g, joined: joined.has(g.id) }));
    },
  });
}

export function useToggleSusu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; joined: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (input.joined) {
        const { error } = await supabase
          .from("susu_memberships")
          .delete()
          .eq("user_id", u.user.id)
          .eq("group_id", input.groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("susu_memberships")
          .insert({ user_id: u.user.id, group_id: input.groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["susu"] }),
  });
}

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, qty")
        .eq("user_id", u.user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ qty: existing.qty + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: u.user.id,
          product_id: product.id,
          product_name: product.name,
          vendor: product.vendor,
          price: product.price,
          qty: 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("cart_items").delete().eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function computeClipScore(incomeCount: number) {
  return Math.min(850, 600 + incomeCount * 4);
}
