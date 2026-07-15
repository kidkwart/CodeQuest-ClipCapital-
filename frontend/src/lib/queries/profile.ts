import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

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
      theme_preference?: "dark" | "light";
    }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No active session");

      const { error } = await supabase.from("profiles")
        .update({
          ...v,
          updated_at: new Date().toISOString()
        })
        .eq("id", authUser.id);

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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

export function useClipScore() {
  const profile = useProfile();
  return {
    score: profile.data?.clip_score ?? 100,
    loading: profile.isLoading
  };
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