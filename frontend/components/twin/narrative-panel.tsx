"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import type { AsyncStatus } from "@/lib/twin-types";

/**
 * Narrative panel — loads independently with its own skeleton.
 * Spec § 4: loads independently, separate skeleton from result cards.
 * Spec § 6: narrative failure doesn't block the page; it's decoration on top
 *           of the numeric result, not load-bearing.
 */
export function NarrativePanel({
  status,
  text,
  onRetry,
}: {
  status: AsyncStatus;
  text: string | null;
  onRetry?: () => void;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-primary/10 bg-gradient-to-br from-primary/5 to-transparent transition-all",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-base">🤖</span>
          AI Weather Analysis
          {status === "loading" && (
            <span className="ml-auto text-xs text-muted-foreground animate-pulse">
              Generating…
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        )}

        {status === "success" && text && (
          <p className="text-sm leading-relaxed text-foreground/80">
            {text}
          </p>
        )}

        {status === "success" && !text && (
          <p className="text-sm text-muted-foreground italic">
            Drag a slider to generate a weather analysis.
          </p>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Narrative generation failed.
            </p>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="gap-1 text-xs"
              >
                <RefreshCwIcon className="size-3" />
                Retry
              </Button>
            )}
          </div>
        )}

        {status === "idle" && (
          <p className="text-sm text-muted-foreground italic">
            Switch to simulated mode and adjust the sliders to see an AI-powered weather impact analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
