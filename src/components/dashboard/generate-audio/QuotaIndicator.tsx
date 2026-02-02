import { QuotaInfo } from "@/hooks/useQuota";
import { AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuotaIndicatorProps {
  quota: QuotaInfo | undefined;
  isLoading: boolean;
}

export function QuotaIndicator({ quota, isLoading }: QuotaIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Zap className="h-4 w-4" />
        <span>Loading usage...</span>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const percentage = (quota.used / quota.limit) * 100;
  const isWarning = percentage >= 80;
  const isAtLimit = quota.isAtLimit;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 text-sm",
          isAtLimit
            ? "text-destructive"
            : isWarning
            ? "text-warning"
            : "text-muted-foreground"
        )}
      >
        {isAtLimit ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        <span>
          Today's usage:{" "}
          <span className="font-medium">
            {quota.used} / {quota.limit}
          </span>{" "}
          generations
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            isAtLimit
              ? "bg-destructive"
              : isWarning
              ? "bg-warning"
              : "bg-primary"
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="text-xs text-destructive">
          You've reached your daily limit. Upgrade your plan to generate more audio.
        </p>
      )}
    </div>
  );
}
