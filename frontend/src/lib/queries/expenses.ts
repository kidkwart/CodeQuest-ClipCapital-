import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

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