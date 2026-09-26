import type { LucideIcon } from "lucide-react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatFrameCardProps = {
  label: string;
  value: string;
  subValue?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: LucideIcon;
  className?: string;
};

function StatFrameCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  className,
}: StatFrameCardProps) {
  const isPositive = trend && trend.value >= 0;
  const caption = subValue ?? trend?.label ?? "";

  return (
    <Card
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-foreground/20 hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="flex size-7.5 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {caption ? (
            <span className="truncate text-xs text-muted-foreground">{caption}</span>
          ) : null}
          {trend ? (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 gap-1 text-[10px] font-semibold tabular-nums",
                isPositive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {isPositive ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {isPositive ? "+" : ""}
              {trend.value}%
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export { StatFrameCard };
