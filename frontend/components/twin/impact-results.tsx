"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ResourceImpact, LogisticsImpact, WeatherMode } from "@/lib/twin-types";

/* ------------------------------------------------------------------ */
/*  Delta badge — shows ▲/▼ + number, never color alone (§ 7)         */
/* ------------------------------------------------------------------ */

function DeltaBadge({ delta, unit = "" }: { delta: number; unit?: string }) {
  if (delta === 0) {
    return (
      <Badge variant="secondary" className="gap-0.5 text-[11px]">
        <MinusIcon className="size-3" /> 0{unit}
      </Badge>
    );
  }

  const isPositive = delta > 0;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-0.5 text-[11px]",
        isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
      )}
    >
      {isPositive ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
      {isPositive ? "+" : ""}{delta}{unit}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Resource Impact Card                                               */
/* ------------------------------------------------------------------ */

function ResourceCard({
  resource,
  showDelta,
}: {
  resource: ResourceImpact;
  showDelta: boolean;
}) {
  const scoreColor =
    resource.adjustedScore >= 70
      ? "text-emerald-400"
      : resource.adjustedScore >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 transition-all hover:bg-card/80">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{resource.name}</span>
        <span className="text-xs text-muted-foreground capitalize">
          {resource.category.replace(/_/g, " ")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-lg font-bold tabular-nums", scoreColor)}>
          {resource.adjustedScore}
        </span>
        {showDelta && <DeltaBadge delta={resource.delta} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logistics Impact Card                                              */
/* ------------------------------------------------------------------ */

function LogisticsCard({
  route,
  showDelta,
}: {
  route: LogisticsImpact;
  showDelta: boolean;
}) {
  const etaDelta = route.adjustedEtaMinutes - route.baseEtaMinutes;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 transition-all hover:bg-card/80">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{route.routeId.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
        <span className="text-xs text-muted-foreground">
          Base: {route.baseEtaMinutes} min → {route.adjustedEtaMinutes} min
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {route.costMultiplier.toFixed(2)}×
        </span>
        {showDelta && <DeltaBadge delta={etaDelta} unit=" min" />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Combined impact results list                                       */
/* ------------------------------------------------------------------ */

export function ImpactResultList({
  resources,
  routes,
  mode,
  simStatus,
}: {
  resources: ResourceImpact[];
  routes: LogisticsImpact[];
  mode: WeatherMode;
  simStatus: string;
}) {
  const showDelta = mode === "simulated";

  // Explicit empty state per spec § 7
  if (simStatus === "success" && resources.length === 0 && routes.length === 0) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl">🌪️</span>
          <p className="text-sm font-medium text-amber-400">
            No available resources under this scenario
          </p>
          <p className="text-xs text-muted-foreground">
            Try reducing rainfall intensity or temperature delta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Resource Impact */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            📦 Resource Impact
            {showDelta && (
              <Badge variant="outline" className="text-[10px]">
                vs baseline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {resources.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {simStatus === "loading" ? "Calculating…" : "No data"}
            </p>
          ) : (
            resources.map((r) => (
              <ResourceCard key={r.resourceId} resource={r} showDelta={showDelta} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Logistics Impact */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            🚚 Logistics Impact
            {showDelta && (
              <Badge variant="outline" className="text-[10px]">
                ETA & cost
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {routes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {simStatus === "loading" ? "Calculating…" : "No data"}
            </p>
          ) : (
            routes.map((r) => (
              <LogisticsCard key={r.routeId} route={r} showDelta={showDelta} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
