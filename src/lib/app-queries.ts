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

export function useUploadAvatar() {
  const { user } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new URL
      await updateProfile.mutateAsync({ avatar_url: publicUrl });

      return publicUrl;
    }
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

      const [
        income,
        expenses,
        orders,
        loans,
        allLoans,
        allOrders,
        allIncome,
        users
      ] = await Promise.all([
        supabase.from("income_entries").select("amount").gte("created_at", today),
        supabase.from("expense_entries").select("amount").gte("created_at", today),
        supabase.from("orders").select("total").gte("created_at", today),
        supabase.from("loan_applications").select("amount").gte("created_at", today).eq("status", "approved"),
        supabase.from("loan_applications").select("amount, status"),
        supabase.from("orders").select("total"),
        supabase.from("income_entries").select("amount"),
        supabase.from("profiles").select("id", { count: 'exact', head: true }),
      ]);

      const totalUsers = users.count ?? 0;
      const dailyIncome = income.data?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
      const dailyExpenses = expenses.data?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
      const dailySales = orders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const dailyLoans = loans.data?.reduce((s, l) => s + Number(l.amount), 0) ?? 0;

      const totalSales = allOrders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const totalIncome = allIncome.data?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;

      const activeRisk = allLoans.data
        ?.filter(l => l.status === 'approved' || l.status === 'repaying')
        .reduce((s, l) => s + Number(l.amount), 0) ?? 0;

      const approvedCount = allLoans.data?.filter(l => l.status === 'approved' || l.status === 'repaying').length ?? 0;
      const totalApplications = allLoans.data?.length ?? 0;
      const approvalRate = totalApplications > 0 ? (approvedCount / totalApplications) * 100 : 0;

      return {
        dailyIncome,
        dailyExpenses,
        dailySales,
        dailyLoans,
        totalVolume: dailyIncome + dailySales,
        totalCash: totalSales + totalIncome,
        activeRisk,
        approvalRate: Math.round(approvalRate),
        totalUsers,
      };
    },
  });
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ["system-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_logs")
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// ---------- Admin: User Health & Insights ----------
export function useUserHealth(userId: string) {
  return useQuery({
    queryKey: ["user-health", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [income, expenses, loans, susu] = await Promise.all([
        supabase.from("income_entries").select("amount, created_at").eq("user_id", userId),
        supabase.from("expense_entries").select("amount").eq("user_id", userId),
        supabase.from("loan_applications").select("status, balance, amount").eq("user_id", userId),
        supabase.from("susu_memberships").select("*, susu_contributions(*)").eq("user_id", userId),
      ]);

      const totalIncome = income.data?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
      const totalExpense = expenses.data?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
      const netProfit = totalIncome - totalExpense;

      const totalLoans = loans.data?.length ?? 0;
      const activeDebt = loans.data?.filter(l => l.status === 'approved' || l.status === 'repaying')
        .reduce((s, l) => s + Number(l.balance), 0) ?? 0;

      // Calculate Susu reliability
      let susuReliability = 100;
      if (susu.data && susu.data.length > 0) {
        const totalContribs = susu.data.reduce((s, m) => s + (m.susu_contributions as any[]).length, 0);
        if (totalContribs === 0) susuReliability = 50;
      }

      return {
        totalIncome,
        totalExpense,
        netProfit,
        activeDebt,
        totalLoans,
        susuReliability,
        entryCount: income.data?.length ?? 0
      };
    },
  });
}

export function useAdjustUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { userId: string; clip_score?: number; business_type?: string }) => {
      const { userId, ...updates } = v;
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-profiles"] }),
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
  return useMutation({
    mutationFn: async (v: { name: string; contribution: number; frequency: string }) => {
      // Ensure frequency is Capitalized (e.g., Weekly)
      const freq = v.frequency.charAt(0).toUpperCase() + v.frequency.slice(1).toLowerCase();

      // Use the RPC for atomic creation to avoid RLS race conditions
      const { data, error } = await supabase.rpc('create_susu_group_v2', {
        _name: v.name,
        _contribution: v.contribution,
        _frequency: freq
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["susu-groups"] });
    },
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
    mutationFn: async (v: {
      group_id: string;
      amount: number;
      momo_provider: string;
      momo_reference: string;
      status?: string;
    }) => {
      const { error } = await supabase.from("susu_contributions").insert({
        ...v,
        user_id: user!.id,
        status: v.status || "pending"
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["susu-contributions", v.group_id] });
      qc.invalidateQueries({ queryKey: ["susu-groups"] });
      qc.invalidateQueries({ queryKey: ["susu-group", v.group_id] });
    },
  });
}

export function useAllSusuGroups() {
  return useQuery({
    queryKey: ["all-susu-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("susu_groups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDisburseSusuPot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { group_id: string, user_id: string, amount: number }) => {
      // 1. Record the payout
      const { error: pErr } = await supabase.from("susu_payouts").insert({
        group_id: v.group_id,
        user_id: v.user_id,
        amount: v.amount,
        paid_at: new Date().toISOString(),
        momo_reference: 'SYS-PAY-' + Math.random().toString(36).substring(7).toUpperCase()
      });
      if (pErr) throw pErr;

      // 2. Mark membership as received
      const { error: mErr } = await supabase.from("susu_memberships")
        .update({ has_received: true })
        .eq("group_id", v.group_id)
        .eq("user_id", v.user_id);
      if (mErr) throw mErr;

      // 3. Clear group pot for next cycle
      const { error: gErr } = await supabase.from("susu_groups")
        .update({ pot: 0, cycle_index: 2 }) // Simple logic: bump cycle
        .eq("id", v.group_id);
      if (gErr) throw gErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-susu-groups"] });
      qc.invalidateQueries({ queryKey: ["susu-group"] });
      qc.invalidateQueries({ queryKey: ["susu-members"] });
    }
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
    mutationFn: async (v: { loan_id: string; amount: number; momo_provider: string; momo_reference: string, status?: string }) => {
      // If status is confirmed (from Paystack), it triggers the DB logic to deduct balance instantly
      const { error } = await supabase.from("loan_repayments").insert({
        ...v,
        user_id: user!.id,
        status: v.status || 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["transaction-history"] });
    },
  });
}

export function usePendingRepayments() {
  return useQuery({
    queryKey: ["pending-repayments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_repayments")
        .select("*, profiles!inner(display_name, business_name), loan_applications!inner(purpose)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useConfirmRepayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status: "confirmed" | "rejected" }) => {
      const { error } = await supabase.from("loan_repayments").update({ status: v.status }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-repayments"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
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
      status?: string;
    }) => {
      const total = v.items.reduce((s, i) => s + i.price * i.qty, 0);
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: user!.id,
        total,
        momo_provider: v.momo_provider ?? "",
        momo_reference: v.momo_reference ?? "",
        payment_method: v.payment_method,
        loan_id: v.loan_id,
        status: v.status || (v.payment_method === "loan" ? "paid" : "pending")
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
    score: profile.data?.clip_score ?? 100,
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

// ---------- Admin Messages / Support ----------
export function useMyMessages() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["admin-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_messages")
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSendMessageToAdmin() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from("admin_messages").insert({
        user_id: user!.id,
        message,
        is_from_admin: false
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });
}

export function useAllUserMessages() {
  return useQuery({
    queryKey: ["all-admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_messages")
        .select("*, profiles!inner(display_name, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useReplyToUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { user_id: string, message: string }) => {
      const { error } = await supabase.from("admin_messages").insert({
        user_id: v.user_id,
        message: v.message,
        is_from_admin: true
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-admin-messages"] }),
  });
}

// ---------- Unified Activity ----------
export type ActivityItem = {
  id: string;
  type: "income" | "expense" | "loan_repayment" | "order" | "susu_contribution";
  amount: number;
  note: string;
  date: string;
  status?: string;
};

export function useRecentActivity(limit = 10) {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["recent-activity", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      // We fetch from multiple tables and merge.
      // In a larger app, we'd use a unified 'transactions' table or a database view.

      const [income, expense, repayments, orders, susu] = await Promise.all([
        supabase.from("income_entries").select("*").eq("user_id", user!.id).order("entry_date", { ascending: false }).limit(limit),
        supabase.from("expense_entries").select("*").eq("user_id", user!.id).order("entry_date", { ascending: false }).limit(limit),
        supabase.from("loan_repayments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("orders").select("*").eq("buyer_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("susu_contributions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
      ]);

      const merged: ActivityItem[] = [
        ...(income.data ?? []).map(i => ({ id: i.id, type: "income" as const, amount: Number(i.amount), note: i.note || "Income Entry", date: i.entry_date })),
        ...(expense.data ?? []).map(e => ({ id: e.id, type: "expense" as const, amount: Number(e.amount), note: e.category || "Expense Entry", date: e.entry_date })),
        ...(repayments.data ?? []).map(r => ({ id: r.id, type: "loan_repayment" as const, amount: Number(r.amount), note: "Loan Repayment", date: r.created_at, status: r.status })),
        ...(orders.data ?? []).map(o => ({ id: o.id, type: "order" as const, amount: Number(o.total), note: "Market Purchase", date: o.created_at, status: o.status })),
        ...(susu.data ?? []).map(s => ({ id: s.id, type: "susu_contribution" as const, amount: Number(s.amount), note: "Susu Contribution", date: s.created_at, status: s.status })),
      ];

      return merged
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
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
  momo_reference?: string;
  momo_provider?: string;
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
        id: r.id, type: "loan_repayment", amount: -Number(r.amount), date: r.created_at, title: "Loan Repayment", status: r.status, momo_reference: r.momo_reference, momo_provider: r.momo_provider
      }));

      orders.data?.forEach((o) => history.push({
        id: o.id, type: "order", amount: -Number(o.total), date: o.created_at, title: "Market Purchase", status: o.status, momo_reference: o.momo_reference, momo_provider: o.momo_provider
      }));

      susu_contribs.data?.forEach((s) => history.push({
        id: s.id, type: "susu_contribution", amount: -Number(s.amount), date: s.created_at, title: `Susu: ${(s.susu_groups as any)?.name || 'Group'}`, status: s.status, momo_reference: s.momo_reference, momo_provider: s.momo_provider
      }));

      susu_payouts.data?.forEach((p) => history.push({
        id: p.id, type: "susu_payout", amount: Number(p.amount), date: p.created_at, title: `Susu Payout: ${(p.susu_groups as any)?.name || 'Group'}`
      }));

      // Sort by date descending
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
}

// ---------- Account Deletion ----------
export function useDeleteAccount() {
  // ... existing code ...
}

// ---------- Revenue Goals ----------
export function useRevenueGoal() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["revenue-goal", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("revenue_goals")
        .select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data || { monthly_target: 1000 };
    },
  });
}

export function useUpdateRevenueGoal() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (target: number) => {
      const { error } = await supabase.from("revenue_goals").upsert({
        user_id: user!.id,
        monthly_target: target,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue-goal"] }),
  });
}

// ---------- Referrals ----------
export function useMyReferrals() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("referrals")
        .select("*").eq("referrer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.from("referrals").insert({
        referrer_id: user!.id,
        referee_email: email,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals"] }),
  });
}
