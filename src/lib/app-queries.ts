import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

// ---------- Profile / role ----------
export function useProfile() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyRoles() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });
}

// ---------- Income ----------
export function useIncome() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["income", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("income_entries")
        .select("*").order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddIncome() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { amount: number; note: string; entry_date: string }) => {
      const { error } = await supabase.from("income_entries").insert({ ...v, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

// ---------- Expenses ----------
export function useExpenses() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["expenses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_entries")
        .select("*").order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { amount: number; category: string; note: string; entry_date: string }) => {
      const { error } = await supabase.from("expense_entries").insert({ ...v, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

// ---------- Susu ----------
export function useMyGroups() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["susu-groups", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from("susu_memberships").select("group_id").eq("user_id", user!.id);
      if (mErr) throw mErr;
      const ids = memberships.map((m) => m.group_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("susu_groups").select("*").in("id", ids);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { name: string; contribution: number; frequency: string }) => {
      const { data: group, error } = await supabase.from("susu_groups").insert({
        name: v.name, contribution: v.contribution, frequency: v.frequency,
        owner_id: user!.id, members_count: 1,
      }).select().single();
      if (error) throw error;
      const { error: mErr } = await supabase.from("susu_memberships").insert({
        group_id: group.id, user_id: user!.id, payout_order: 1,
      });
      if (mErr) throw mErr;
      return group;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["susu-groups"] }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { joinSusuByInvite } = await import("@/lib/susu.functions");
      const result = await joinSusuByInvite({ data: { invite: inviteCode.trim() } });
      return result.groupId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["susu-groups"] }),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ["susu-group", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("susu_groups").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: ["susu-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("susu_memberships").select("*, profiles!inner(display_name)")
        .eq("group_id", id).order("payout_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useGroupContributions(id: string) {
  return useQuery({
    queryKey: ["susu-contributions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("susu_contributions").select("*").eq("group_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRecordContribution() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { group_id: string; amount: number; momo_provider: string; momo_reference: string }) => {
      const { error } = await supabase.from("susu_contributions").insert({ ...v, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["susu-contributions", v.group_id] }),
  });
}

// ---------- Loans ----------
export function useMyLoans() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["loans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_applications")
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useApplyForLoan() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { amount: number; term_months: number; purpose: string }) => {
      const { error } = await supabase.from("loan_applications").insert({
        ...v, user_id: user!.id, status: "pending", balance: v.amount,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
  });
}

export function useRecordRepayment() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { loan_id: string; amount: number; momo_provider: string; momo_reference: string }) => {
      const { error } = await supabase.from("loan_repayments").insert({ ...v, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
  });
}

// ---------- Admin: loans ----------
export function usePendingLoans() {
  return useQuery({
    queryKey: ["pending-loans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_applications")
        .select("*, profiles!inner(display_name, business_name)")
        .in("status", ["pending", "approved", "repaying"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useReviewLoan() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { id: string; status: "approved" | "rejected"; decision_note: string }) => {
      const { error } = await supabase.from("loan_applications").update({
        status: v.status,
        decision_note: v.decision_note,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        disbursed_at: v.status === "approved" ? new Date().toISOString() : null,
      }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-loans"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

// ---------- Marketplace ----------
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*")
        .eq("active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyProducts() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["my-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { name: string; description: string; price: number; image_url: string; stock: number }) => {
      const { error } = await supabase.from("products").insert({ ...v, vendor_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["my-products"] });
    },
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; price?: number; stock?: number; active?: boolean; name?: string; description?: string; image_url?: string }) => {
      const { id, ...patch } = v;
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["all-products"] });
      qc.invalidateQueries({ queryKey: ["my-products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["all-products"] });
      qc.invalidateQueries({ queryKey: ["my-products"] });
    },
  });
}

// ---------- Orders ----------
export type CartItem = { product_id: string; vendor_id: string; name: string; price: number; qty: number };

export function useMyOrders() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, order_items(*, products(name))").eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { items: CartItem[]; momo_provider: string; momo_reference: string }) => {
      const total = v.items.reduce((s, i) => s + i.price * i.qty, 0);
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: user!.id, total, momo_provider: v.momo_provider, momo_reference: v.momo_reference,
      }).select().single();
      if (error) throw error;
      const items = v.items.map((i) => ({
        order_id: order.id, product_id: i.product_id, vendor_id: i.vendor_id, qty: i.qty, price: i.price,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;
      return order;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// ---------- ClipScore (derived) ----------
export function useClipScore() {
  const income = useIncome();
  const loans = useMyLoans();
  const base = 600;
  const entries = income.data?.length ?? 0;
  const onTime = loans.data?.filter((l) => l.status === "closed").length ?? 0;
  const score = Math.min(850, base + entries * 4 + onTime * 25);
  return { score, loading: income.isLoading || loans.isLoading };
}

// ---------- Admin: role management ----------
export function useGrantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { user_id: string; role: "admin" | "vendor" | "user" }) => {
      const { error } = await supabase.from("user_roles").insert(v);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
