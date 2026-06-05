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

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: {
      display_name?: string;
      business_name?: string;
      business_type?: string;
      location?: string;
      phone_number?: string;
      bio?: string;
      avatar_url?: string;
    }) => {
      const { error } = await supabase.from("profiles").update(v).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("*")
        .order("clip_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [income, expenses, orders, loans] = await Promise.all([
        supabase.from("income_entries").select("amount").gte("created_at", today),
        supabase.from("expense_entries").select("amount").gte("created_at", today),
        supabase.from("orders").select("total").gte("created_at", today),
        supabase.from("loan_applications").select("amount").gte("created_at", today).eq("status", "approved"),
      ]);

      const dailyIncome = income.data?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
      const dailyExpenses = expenses.data?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
      const dailySales = orders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const dailyLoans = loans.data?.reduce((s, l) => s + Number(l.amount), 0) ?? 0;

      return {
        dailyIncome,
        dailyExpenses,
        dailySales,
        dailyLoans,
        totalVolume: dailyIncome + dailySales
      };
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
  return useMutation({
    mutationFn: async (v: { amount: number; note: string; entry_date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to log income");

      const { error } = await supabase.from("income_entries").insert({
        ...v,
        user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["profile"] }); // Refresh score
    },
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
        .select("*, profiles(display_name, business_name)") // Removed !inner to allow loans without profiles to show
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
    mutationFn: async (v: {
      id: string;
      status: "approved" | "rejected";
      decision_note: string;
      interest_rate?: number;
    }) => {
      // Simulate MoMo Payout for approved loans
      if (v.status === "approved") {
        console.log("Simulating MoMo Payout...");
        // In a real app, you would call a MoMo API here (MTN/Vodafone/AirtelTigo)
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      const { error } = await supabase.from("loan_applications").update({
        status: v.status,
        decision_note: v.decision_note,
        interest_rate: v.interest_rate ?? 5.0,
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
      qc.invalidateQueries({ queryKey: ["all-products"] });
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

export function useAllOrders() {
  return useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, profiles!inner(display_name, business_name), order_items(*, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status: v.status }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: {
      items: CartItem[];
      momo_provider?: string;
      momo_reference?: string;
      payment_method: "momo" | "loan";
      loan_id?: string;
    }) => {
      const total = v.items.reduce((s, i) => s + i.price * i.qty, 0);
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: user!.id,
        total,
        momo_provider: v.momo_provider ?? "",
        momo_reference: v.momo_reference ?? "",
        payment_method: v.payment_method,
        loan_id: v.loan_id,
        status: v.payment_method === "loan" ? "paid" : "pending"
      }).select().single();

      if (error) throw error;

      const items = v.items.map((i) => ({
        order_id: order.id, product_id: i.product_id, vendor_id: i.vendor_id, qty: i.qty, price: i.price,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

// ---------- ClipScore (synced from DB) ----------
export function useClipScore() {
  const profile = useProfile();
  return {
    score: profile.data?.clip_score ?? 600,
    loading: profile.isLoading
  };
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

// ---------- Notifications ----------
export function useNotifications() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications")
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications")
        .update({ read: true }).eq("user_id", user!.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

// ---------- Product Requests ----------
export function useMyProductRequests() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["product-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_requests")
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProductRequest() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { product_name: string; estimated_price?: number; note?: string }) => {
      const { error } = await supabase.from("product_requests").insert({ ...v, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-requests"] }),
  });
}

export function useAllProductRequests() {
  return useQuery({
    queryKey: ["all-product-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_requests")
        .select("*, profiles!inner(display_name, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ---------- Transaction History ----------
export type Transaction = {
  id: string;
  type: "income" | "expense" | "loan_payout" | "loan_repayment" | "order" | "susu_contribution" | "susu_payout";
  amount: number;
  date: string;
  title: string;
  note?: string;
  status?: string;
};

export function useTransactionHistory() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["transaction-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const userId = user!.id;

      // Fetch all sources in parallel
      const [
        income,
        expenses,
        loans,
        repayments,
        orders,
        susu_contribs,
        susu_payouts,
      ] = await Promise.all([
        supabase.from("income_entries").select("*").eq("user_id", userId),
        supabase.from("expense_entries").select("*").eq("user_id", userId),
        supabase.from("loan_applications").select("*").eq("user_id", userId).not("disbursed_at", "is", null),
        supabase.from("loan_repayments").select("*").eq("user_id", userId),
        supabase.from("orders").select("*").eq("buyer_id", userId),
        supabase.from("susu_contributions").select("*, susu_groups(name)").eq("user_id", userId),
        supabase.from("susu_payouts").select("*, susu_groups(name)").eq("user_id", userId),
      ]);

      const history: Transaction[] = [];

      income.data?.forEach((i) => history.push({
        id: i.id, type: "income", amount: Number(i.amount), date: i.created_at, title: "Income Entry", note: i.note
      }));

      expenses.data?.forEach((e) => history.push({
        id: e.id, type: "expense", amount: -Number(e.amount), date: e.created_at, title: `Expense: ${e.category}`, note: e.note
      }));

      loans.data?.forEach((l) => history.push({
        id: l.id, type: "loan_payout", amount: Number(l.amount), date: l.disbursed_at!, title: "Loan Payout", note: l.purpose
      }));

      repayments.data?.forEach((r) => history.push({
        id: r.id, type: "loan_repayment", amount: -Number(r.amount), date: r.created_at, title: "Loan Repayment", status: r.status
      }));

      orders.data?.forEach((o) => history.push({
        id: o.id, type: "order", amount: -Number(o.total), date: o.created_at, title: "Market Purchase", status: o.status
      }));

      susu_contribs.data?.forEach((s) => history.push({
        id: s.id, type: "susu_contribution", amount: -Number(s.amount), date: s.created_at, title: `Susu: ${(s.susu_groups as any)?.name || 'Group'}`, status: s.status
      }));

      susu_payouts.data?.forEach((p) => history.push({
        id: p.id, type: "susu_payout", amount: Number(p.amount), date: p.created_at, title: `Susu Payout: ${(p.susu_groups as any)?.name || 'Group'}`
      }));

      // Sort by date descending
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
}
