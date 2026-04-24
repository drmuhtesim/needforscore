import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

export const useUserRoles = () => {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["userRoles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const roles = q.data ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator") || roles.includes("admin"),
    loading: q.isLoading,
  };
};
