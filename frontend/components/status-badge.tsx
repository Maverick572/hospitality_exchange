import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  available: "success",
  accepted: "success",
  completed: "success",
  released: "success",
  delivered: "success",
  verified: "success",
  funded: "info",
  confirmed: "info",
  driver_assigned: "info",
  picked_up: "info",
  in_transit: "info",
  pending: "warning",
  pickup_pending: "warning",
  countered: "warning",
  unverified: "warning",
  rejected: "danger",
  cancelled: "danger",
  refunded: "danger",
  inactive: "neutral",
};

export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  const key = (status ?? "").toLowerCase();
  const tone = STATUS_TONE[key] ?? "neutral";
  return (
    <Badge variant="outline" className={cn("font-normal", TONES[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {humanize(status)}
    </Badge>
  );
}
