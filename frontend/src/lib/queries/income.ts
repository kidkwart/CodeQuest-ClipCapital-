import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

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

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { amount: number; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

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