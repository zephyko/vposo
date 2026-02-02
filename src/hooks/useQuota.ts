import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
}

export function useQuota() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quota", user?.id],
    queryFn: async (): Promise<QuotaInfo> => {
      if (!user) {
        return { used: 0, limit: 20, remaining: 20, isAtLimit: false };
      }

      // Get user's daily limit from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("daily_generation_limit")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to fetch profile for quota:", profileError);
        throw profileError;
      }

      const limit = profile?.daily_generation_limit ?? 20;

      // Count generations in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error: countError } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", twentyFourHoursAgo);

      if (countError) {
        console.error("Failed to count generations:", countError);
        throw countError;
      }

      const used = count ?? 0;

      return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isAtLimit: used >= limit,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Refresh every 30 seconds
  });
}
