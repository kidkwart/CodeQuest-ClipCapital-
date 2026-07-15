import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

/**
 * Optimized hook to get the current authenticated user.
 * Uses React Query for deduplication and caching across the app.
 * Synchronized with Supabase auth events.
 */
export function useCurrentUser() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return null;
      return user;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        qc.setQueryData(["current-user"], session?.user ?? null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  return { user: user ?? null, loading: isLoading };
}
