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
      username?: string;
      business_name?: string;
      business_type?: string;
      location?: string;
      phone_number?: string;
      bio?: string;
      avatar_url?: string;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
      wallet_balance?: number;
      notifications_enabled?: boolean;
      privacy_mode_enabled?: boolean;
      security_2fa_enabled?: boolean;
      sms_backup_enabled?: boolean;
      biometric_enabled?: boolean;
      access_pin?: string;
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
        .select("id, display_name, business_name, status, clip_score, avatar_url")
        .order("clip_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;

      const approvalRate = data.totalApplications > 0
        ? (data.approvedCount / data.totalApplications) * 100
        : 0;

      return {
        ...data,
        totalVolume: (data.dailyIncome || 0) + (data.dailySales || 0),
        totalCash: (data.totalSales || 0) + (data.totalIncome || 0),
        approvalRate: Math.round(approvalRate),
      };
    },
    staleTime: 30000,
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

export function useLoans() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["loans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useApplyLoan() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: { amount: number; duration_days: number; purpose: string }) => {
      if (!user) throw new Error("You must be logged in to apply for a loan.");

      // Ensure we include all likely required fields
      const { data, error } = await supabase.from("loan_applications").insert({
        user_id: user.id,
        amount: v.amount,
        balance: Math.round(v.amount * 1.15 * 100) / 100, // 15% interest
        status: 'pending',
        purpose: v.purpose,
        duration_days: v.duration_days,
        term_months: 1 // fallback if this is used instead
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans", user?.id] });
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

// ---------- Income (Accounting Log) ----------
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
    mutationFn: async (v: { amount: number; note: string; entry_date?: string }) => {
      // PURELY ACCOUNTING: Just insert the record
      const { error } = await supabase.from("income_entries").insert({
        user_id: user!.id,
        amount: v.amount,
        note: v.note,
        entry_date: v.entry_date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["income"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
        qc.invalidateQueries({ queryKey: ["recent-activity"] }),
        qc.invalidateQueries({ queryKey: ["admin-stats"] }),
        qc.invalidateQueries({ queryKey: ["user-health"] }),
        qc.invalidateQueries({ queryKey: ["weekly-performance"] }),
      ]);
    },
  });
}

// ---------- Deposits (Actual Money into Wallet) ----------
export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { amount: number; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      // Use the RPC to actually increase the profile wallet balance
      const { error } = await supabase.rpc('deposit_funds', {
        user_uuid: user.id,
        deposit_amount: v.amount,
        deposit_note: v.note
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["profile"] }),
        qc.invalidateQueries({ queryKey: ["transaction-history"] }),
        qc.invalidateQueries({ queryKey: ["recent-activity"] }),
      ]);
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
  return useMutation({
    mutationFn: async (v: { amount: number; category: string; note: string; entry_date?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session found. Please sign in again.");

      const { error } = await supabase.rpc('withdraw_funds', {
        user_uuid: user.id,
        amount_to_withdraw: v.amount,
        withdrawal_note: v.note,
        category_name: v.category
      });

      if (error) {
        console.error("Withdraw Error:", error);
        if (error.message.includes('balance')) {
          throw new Error("INSUFFICIENT_BALANCE");
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["expenses"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
        qc.invalidateQueries({ queryKey: ["recent-activity"] }),
        qc.invalidateQueries({ queryKey: ["transaction-history"] }),
        qc.invalidateQueries({ queryKey: ["admin-stats"] }),
        qc.invalidateQueries({ queryKey: ["weekly-performance"] }),
      ]);
    },
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
      console.log("Fetching memberships for user:", user?.id);

      // We use a single query with an inner join to be as robust as possible.
      // This ensures we only get groups the user actually belongs to.
      const { data, error } = await supabase
        .from("susu_groups")
        .select(`
          *,
          susu_memberships!inner(user_id)
        `)
        .eq("susu_memberships.user_id", user!.id);

      if (error) {
        console.error("Error fetching my groups:", error);
        throw error;
      }

      console.log("Successfully loaded my groups:", data?.length);
      return data || [];
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { name: string; contribution: number; frequency: string }) => {
      // Ensure frequency is Capitalized (e.g., Weekly)
      const freq = v.frequency.charAt(0).toUpperCase() + v.frequency.slice(1).toLowerCase();

      console.log("Calling create_susu_group_v2 with:", { _name: v.name, _contribution: v.contribution, _frequency: freq });
      const { data, error } = await supabase.rpc('create_susu_group_v2', {
        _name: v.name,
        _contribution: v.contribution,
        _frequency: freq
      });

      if (error) {
        console.error("RPC Error:", error);
        if (error.message.includes('unique constraint') || error.code === '23505') {
          throw new Error("A circle with this name already exists. Please choose a unique name.");
        }
        throw error;
      }
      console.log("RPC Success, new group ID:", data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["susu-groups"] });
      qc.invalidateQueries({ queryKey: ["all-susu-groups"] });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc('join_susu_by_invite', {
        _invite: inviteCode.trim()
      });

      if (error) {
        if (error.message.includes('Already a member')) throw new Error("You are already a member of this group");
        if (error.message.includes('Invalid invite code')) throw new Error("Invalid invite code");
        throw error;
      }

      return data; // This is the group_id
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["susu-groups"] }),
        qc.invalidateQueries({ queryKey: ["all-susu-groups"] }),
      ]);
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc('leave_susu_group', {
        _group_id: groupId
      });

      if (error) {
        if (error.message.includes('balance')) throw new Error("Insufficient wallet balance for the 100 GHS exit penalty.");
        throw error;
      }
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["susu-groups"] }),
        qc.invalidateQueries({ queryKey: ["all-susu-groups"] }),
        qc.invalidateQueries({ queryKey: ["susu-contributions"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ["susu-group", id],
    enabled: !!id && id !== "undefined",
    queryFn: async () => {
      console.log("Fetching group details for:", id);
      // Try by ID first
      let { data, error } = await supabase.from("susu_groups").select("*").eq("id", id).maybeSingle();

      // If not found, try by invite_code (backup)
      if (!data && !error) {
         const resp = await supabase.from("susu_groups").select("*").eq("invite_code", id).maybeSingle();
         data = resp.data;
         error = resp.error;
      }

      if (error) throw error;
      if (!data) throw new Error("This circle no longer exists or you don't have access.");

      return data;
    },
  });
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: ["susu-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("susu_memberships").select("*, profiles!inner(*)")
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
      cycle_index: number;
      momo_provider: string;
      momo_reference: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      // 1. Deduct from wallet
      const { error: wErr } = await supabase.rpc('withdraw_funds', {
        user_uuid: user.id,
        amount_to_withdraw: v.amount,
        withdrawal_note: `Susu Contribution - ${v.group_id}`,
        category_name: "Savings"
      });

      if (wErr) throw new Error(wErr.message);

      // 2. Record contribution
      const { error } = await supabase.from("susu_contributions").insert({
        ...v,
        user_id: user.id,
        status: v.status || "paid"
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

      // 3. Clear group pot and increment cycle
      const { data: gData } = await supabase.from("susu_groups").select("cycle_index").eq("id", v.group_id).single();
      const nextCycle = (gData?.cycle_index || 1) + 1;

      const { error: gErr } = await supabase.from("susu_groups")
        .update({ pot: 0, cycle_index: nextCycle })
        .eq("id", v.group_id);
      if (gErr) throw gErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-susu-groups"] });
      qc.invalidateQueries({ queryKey: ["susu-group"] });
      qc.invalidateQueries({ queryKey: ["susu-members"] });
      qc.invalidateQueries({ queryKey: ["transaction-history"] });
      qc.invalidateQueries({ queryKey: ["recent-activity"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
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

export function useMyActiveLoans() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["active-loans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_applications")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["approved", "repaying"])
        .order("created_at", { ascending: false });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      // 1. If paying with Wallet, deduct funds first
      if (v.momo_provider === "Wallet") {
        const { error: wErr } = await supabase.rpc('withdraw_funds', {
          user_uuid: user.id,
          amount_to_withdraw: v.amount,
          withdrawal_note: `Loan Repayment (ID: ${v.loan_id})`,
          category_name: "Debt"
        });
        if (wErr) throw new Error(wErr.message);
      }

      // 2. Record the repayment
      // The DB trigger 'on_loan_repayment_sync' must exist to update the loan balance
      const { error } = await supabase.from("loan_repayments").insert({
        ...v,
        user_id: user.id,
        status: v.status || 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
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

// ---------- Admin: Susu Payouts ----------
export function usePendingSusuPayouts() {
  return useQuery({
    queryKey: ["pending-susu-payouts"],
    queryFn: async () => {
      // Find groups where pot > 0
      const { data, error } = await supabase.from("susu_groups")
        .select("*, owner:profiles!inner(display_name)")
        .gt("pot", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ---------- Admin: loans ----------
export function usePendingLoans() {
  return useQuery({
    queryKey: ["pending-loans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loan_applications")
        .select("*, profiles:user_id(display_name, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10000,
  });
}

export function useReviewLoan() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async (v: {
      id: string | string[];
      status: "approved" | "rejected";
      decision_note?: string;
    }) => {
      const ids = Array.isArray(v.id) ? v.id : [v.id];

      // 1. Update all statuses in one go
      const { data: updatedLoans, error: updateError } = await supabase
        .from("loan_applications")
        .update({
          status: v.status,
          decision_note: v.decision_note || (v.status === "approved" ? "Approved by Admin" : "Rejected by Admin"),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          disbursed_at: v.status === "approved" ? new Date().toISOString() : null,
        })
        .in("id", ids)
        .select();

      if (updateError) throw updateError;
      if (!updatedLoans || updatedLoans.length === 0) throw new Error("No loans were updated. Check permissions.");

      // 2. If approved, process deposits for each loan
      if (v.status === "approved") {
        for (const loan of updatedLoans) {
          const { error: rpcError } = await supabase.rpc('deposit_funds', {
            user_uuid: loan.user_id,
            deposit_amount: Number(loan.amount),
            deposit_note: `Loan Disbursement (ID: ${loan.id})`
          });

          if (rpcError) console.error("Deposit failed for loan", loan.id, rpcError);

          // Non-blocking notification
          supabase.from("notifications").insert({
            user_id: loan.user_id,
            title: "Loan Approved",
            body: `Your loan of GH₵ ${loan.amount} has been credited to your wallet.`,
            type: "success"
          }).then();
        }
      }
    },
    onSuccess: () => {
      // Force refresh multiple queries
      qc.invalidateQueries({ queryKey: ["pending-loans"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    },
  });
}

// ---------- Admin: Support ----------
export function useAllUserMessages() {
  return useQuery({
    queryKey: ["all-admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_messages")
        .select("*, profiles:user_id(display_name, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
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
      payment_method: "momo" | "loan" | "wallet";
      loan_id?: string;
      status?: string;
    }) => {
      console.log("Starting usePlaceOrder mutation with:", v);
      const total = v.items.reduce((s, i) => s + i.price * i.qty, 0);

      // 1. If paying with Wallet, deduct funds FIRST
      if (v.payment_method === "wallet") {
        console.log("Processing wallet payment, total:", total);
        const { error: walletError } = await supabase.rpc('withdraw_funds', {
          user_uuid: user!.id,
          amount_to_withdraw: total,
          withdrawal_note: `Marketplace Order`,
          category_name: 'Shopping'
        });
        if (walletError) {
          console.error("Wallet deduction failed:", walletError);
          if (walletError.message.includes('balance')) throw new Error("INSUFFICIENT_BALANCE");
          throw walletError;
        }
      }

      // 2. Create the main order record
      const orderData: any = {
        buyer_id: user!.id,
        total,
        momo_provider: v.momo_provider || (v.payment_method === 'wallet' ? 'Wallet' : "System"),
        momo_reference: v.momo_reference || "",
        payment_method: v.payment_method === 'wallet' ? 'momo' : v.payment_method,
        status: v.status || (v.payment_method === "loan" || v.payment_method === "wallet" ? "paid" : "pending")
      };

      if (v.loan_id) {
        orderData.loan_id = v.loan_id;
      }

      console.log("Inserting order into DB:", orderData);
      const { data: order, error } = await supabase.from("orders").insert(orderData).select().single();

      if (error) {
        console.error("Supabase Order Insert Error:", error);
        throw error;
      }

      // 3. Insert order items
      const items = await Promise.all(v.items.map(async (i) => {
        let vId = i.vendor_id;

        // If vendor_id is missing in the cart item, try to find it on the product
        if (!vId) {
          const { data: pData } = await supabase
            .from("products")
            .select("vendor_id")
            .eq("id", i.product_id)
            .maybeSingle();
          vId = pData?.vendor_id;
        }

        // Emergency fallback to admin if vendor is still missing
        if (!vId) {
          console.warn(`Vendor missing for ${i.name}, falling back to admin.`);
          const { data: adminRole } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
          vId = adminRole?.user_id;
        }

        if (!vId) {
          throw new Error(`Critical: No vendor found for product: ${i.name}`);
        }

        return {
          order_id: order.id,
          product_id: i.product_id,
          vendor_id: vId,
          qty: i.qty,
          price: i.price,
        };
      }));

      console.log("Inserting order items:", items);
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) {
        console.error("Supabase Order Items Insert Error:", iErr);
        // Attempt to rollback the order
        await supabase.from("orders").delete().eq("id", order.id);
        throw iErr;
      }

      return order;
    },
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
        qc.invalidateQueries({ queryKey: ["loans"] }),
        qc.invalidateQueries({ queryKey: ["transaction-history"] }),
        qc.invalidateQueries({ queryKey: ["recent-activity"] }),
      ]);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-admin-messages"] });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });
}

// ---------- Withdrawals ----------
export function useMyWithdrawals() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["my-withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests")
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { amount: number, bank_name: string, account_number: string, account_name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session found.");

      const { error } = await supabase.from("withdrawal_requests").insert({
        ...v,
        user_id: user.id,
        status: 'pending'
      });

      if (error) {
        console.error("Withdrawal Request Error:", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["all-withdrawal-requests"] });
    },
  });
}

export function useAllWithdrawalRequests() {
  return useQuery({
    queryKey: ["all-withdrawal-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests")
        .select("*, profiles!inner(display_name, business_name, wallet_balance)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string, status: 'completed' | 'rejected', notes?: string }) => {
      // 1. Get the withdrawal details first (to know the amount and user)
      const { data: request, error: fetchError } = await supabase
        .from("withdrawal_requests")
        .select("amount, user_id")
        .eq("id", v.id)
        .single();

      if (fetchError) throw fetchError;

      // 2. If COMPLETED, deduct the money and log expense FIRST
      // We do this first because if the wallet deduction fails (insufficient funds),
      // we shouldn't mark the request as completed.
      if (v.status === 'completed') {
        const { error: rpcError } = await supabase.rpc('withdraw_funds', {
          user_uuid: request.user_id,
          amount_to_withdraw: Number(request.amount),
          withdrawal_note: `Withdrawal Approved (ID: ${v.id})`,
          category_name: 'Withdrawal'
        });

        if (rpcError) throw rpcError;
      }

      // 3. Update the withdrawal status in the table
      const { error: statusError } = await supabase.from("withdrawal_requests").update({
        status: v.status,
        notes: v.notes || (v.status === 'completed' ? 'Processed by Admin' : 'Declined by Admin'),
        processed_at: new Date().toISOString()
      }).eq("id", v.id);

      if (statusError) throw statusError;

      // 4. Create a notification for the user
      await supabase.from("notifications").insert({
        user_id: request.user_id,
        title: v.status === 'completed' ? "Withdrawal Successful" : "Withdrawal Declined",
        body: v.status === 'completed'
          ? `Your withdrawal of GH₵ ${request.amount} has been processed and sent to your bank.`
          : `Your withdrawal request for GH₵ ${request.amount} was declined.`,
        type: v.status === 'completed' ? "success" : "error"
      });

      return { id: v.id, status: v.status };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-withdrawal-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    },
  });
}

// ---------- Performance & Growth ----------
export function useWeeklyPerformance() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["weekly-performance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Calculate the Sunday of the CURRENT week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      // We want Sunday to Sunday (8 days total)
      const daysToFetch = 8;

      const [income, expenses] = await Promise.all([
        supabase.from("income_entries")
          .select("amount, created_at")
          .eq("user_id", user!.id)
          .gte("created_at", startOfWeek.toISOString()),
        supabase.from("expense_entries")
          .select("amount, created_at")
          .eq("user_id", user!.id)
          .gte("created_at", startOfWeek.toISOString())
      ]);

      const labels: string[] = [];
      const data: number[] = [];
      const revenueData: number[] = []; // New array for gross revenue
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < daysToFetch; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const localDateStr = d.toLocaleDateString('en-CA');

        labels.push(dayNames[i]);

        const dailyIncome = income.data
          ?.filter(i => new Date(i.created_at).toLocaleDateString('en-CA') === localDateStr)
          .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

        const dailyExpense = expenses.data
          ?.filter(e => new Date(e.created_at).toLocaleDateString('en-CA') === localDateStr)
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        data.push(dailyIncome - dailyExpense);
        revenueData.push(dailyIncome); // Only track sales/income
      }

      const first = data[0] || 0;
      const currentVal = data[dayOfWeek];

      let growth = 0;
      if (first !== 0) {
        growth = ((currentVal - first) / Math.abs(first)) * 100;
      } else if (currentVal !== 0) {
        growth = 100;
      }

      return {
        data,
        revenueData, // Pass the sales-only data
        labels,
        todayIndex: dayOfWeek,
        growth: growth.toFixed(1),
        isPositive: growth >= 0
      };
    },
  });
}

// ---------- Unified Activity ----------
export type ActivityItem = {
  id: string;
  type: "income" | "expense" | "loan_payout" | "loan_repayment" | "order" | "susu_contribution" | "susu_payout";
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
      const [income, expense, repayments, orders, susu, susu_payouts, loan_payouts] = await Promise.all([
        supabase.from("income_entries").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("expense_entries").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("loan_repayments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("orders").select("*").eq("buyer_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("susu_contributions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("susu_payouts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("loan_applications").select("*").eq("user_id", user!.id).not("disbursed_at", "is", null).order("disbursed_at", { ascending: false }).limit(limit),
      ]);

      const merged: ActivityItem[] = [
        ...(income.data ?? []).map(i => ({ id: i.id, type: "income" as const, amount: Number(i.amount), note: i.note || "Income Entry", date: i.created_at })),
        ...(expense.data ?? []).map(e => ({ id: e.id, type: "expense" as const, amount: -Number(e.amount), note: e.category || "Expense Entry", date: e.created_at })),
        ...(repayments.data ?? []).map(r => ({ id: r.id, type: "loan_repayment" as const, amount: -Number(r.amount), note: "Loan Repayment", date: r.created_at, status: r.status })),
        ...(orders.data ?? []).map(o => ({ id: o.id, type: "order" as const, amount: -Number(o.total), note: "Market Purchase", date: o.created_at, status: o.status })),
        ...(susu.data ?? []).map(s => ({ id: s.id, type: "susu_contribution" as const, amount: -Number(s.amount), note: "Susu Contribution", date: s.created_at, status: s.status })),
        ...(susu_payouts.data ?? []).map(p => ({ id: p.id, type: "susu_payout" as const, amount: Number(p.amount), note: "Susu Pot Payout", date: p.created_at })),
        ...(loan_payouts.data ?? []).map(l => ({ id: l.id, type: "loan_payout" as const, amount: Number(l.amount), note: "Loan Disbursement", date: l.disbursed_at! })),
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

// ---------- System Settings & Admin Tools ----------

export function useSystemSettings() {
  const qc = useQueryClient();
  return {
    settings: useQuery({
      queryKey: ["system-settings"],
      queryFn: async () => {
        const { data, error } = await supabase.from("system_settings").select("*").single();
        if (error) throw error;
        return data;
      },
      staleTime: 10000, // Reduced to 10 seconds for near-instant lockdown
      refetchInterval: 30000, // Auto-check every 30 seconds as a safety net
    }),
    updateSettings: useMutation({
      mutationFn: async (updates: any) => {
        const { error } = await supabase.from("system_settings").update(updates).eq("id", 1);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["system-settings"] }),
    }),
  };
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      const { data: users } = await supabase.from("profiles").select("id");
      if (!users) return;

      const notifications = users.map(u => ({
        user_id: u.id,
        title,
        body,
        type: "system"
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
    }
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    },
  });
}

// ---------- Account Deletion ----------
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
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
