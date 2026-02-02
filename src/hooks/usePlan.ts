import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserPlan = "free" | "creator" | "pro";

export interface PlanInfo {
  plan: UserPlan;
  dailyLimit: number;
}

export const PLAN_LIMITS: Record<UserPlan, number> = {
  free: 20,
  creator: 200,
  pro: 1000,
};

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free",
  creator: "Creator",
  pro: "Pro",
};

export function usePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["user-plan", user?.id],
    queryFn: async (): Promise<PlanInfo> => {
      if (!user) {
        return { plan: "free", dailyLimit: PLAN_LIMITS.free };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("plan, daily_generation_limit")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch plan:", error);
        throw error;
      }

      const plan = (data?.plan as UserPlan) || "free";
      return {
        plan,
        dailyLimit: data?.daily_generation_limit ?? PLAN_LIMITS[plan],
      };
    },
    enabled: !!user,
  });

  const switchPlanMutation = useMutation({
    mutationFn: async (newPlan: UserPlan) => {
      const { error } = await supabase.rpc("update_user_plan", {
        new_plan: newPlan,
      });

      if (error) throw error;
      return newPlan;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      queryClient.invalidateQueries({ queryKey: ["quota"] });
    },
  });

  return {
    plan: planQuery.data?.plan ?? "free",
    dailyLimit: planQuery.data?.dailyLimit ?? PLAN_LIMITS.free,
    isLoading: planQuery.isLoading,
    switchPlan: switchPlanMutation.mutate,
    isSwitching: switchPlanMutation.isPending,
  };
}
