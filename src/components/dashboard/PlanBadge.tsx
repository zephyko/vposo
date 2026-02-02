import { usePlan, PLAN_LABELS, UserPlan } from "@/hooks/usePlan";
import { useQuota } from "@/hooks/useQuota";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<UserPlan, React.ReactNode> = {
  free: <Zap className="h-3 w-3" />,
  creator: <Sparkles className="h-3 w-3" />,
  pro: <Crown className="h-3 w-3" />,
};

const PLAN_VARIANTS: Record<UserPlan, "outline" | "secondary" | "default"> = {
  free: "outline",
  creator: "secondary",
  pro: "default",
};

export function PlanBadge() {
  const { plan, isLoading: planLoading } = usePlan();
  const { data: quota, isLoading: quotaLoading } = useQuota();

  if (planLoading || quotaLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <Badge variant="outline" className="opacity-50">
          Loading...
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant={PLAN_VARIANTS[plan]}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1",
          plan === "pro" && "bg-primary"
        )}
      >
        {PLAN_ICONS[plan]}
        {PLAN_LABELS[plan]}
      </Badge>
      
      {quota && (
        <span className="text-xs text-muted-foreground">
          {quota.used}/{quota.limit} today
        </span>
      )}
    </div>
  );
}
