import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangleIcon, ConstructionIcon, InboxIcon, RotateCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Spinner />
      {label}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-xl border border-dashed border-border bg-card/40", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/**
 * Error panel. A route the backend hasn't built yet gets its own wording, so
 * it reads as "coming soon" rather than as a bug.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const notImplemented = false;
  const message = error instanceof Error ? error.message : "Something went wrong.";

  if (notImplemented) {
    return (
      <EmptyState
        icon={ConstructionIcon}
        title="Not live yet"
        description={
          <>
            {message} This screen is ready and will work as soon as the endpoint ships.
          </>
        }
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={AlertTriangleIcon}
      title="Couldn't load this"
      description={message}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCwIcon data-icon="inline-start" />
            Try again
          </Button>
        ) : null
      }
    />
  );
}
