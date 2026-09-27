"use client";

import { ArrowRightIcon, RouteIcon, StarIcon, TruckIcon } from "lucide-react";

import { ErrorState, ListSkeleton, EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { logisticsApi } from "@/lib/api";
import { inr } from "@/lib/format";
import type { GeoLocation, RouteMatch } from "@/lib/types";

export type DeliveryQuery = {
  title: string;
  pickupLocation: Partial<GeoLocation>;
  deliveryLocation: Partial<GeoLocation>;
  requiredCapacity: number;
  travelDate?: string | null;
};

/** Shared-route delivery options for a pickup → drop pair (section 8B). */
export function DeliveryDialog({
  query,
  onOpenChange,
}: {
  query: DeliveryQuery;
  onOpenChange: (open: boolean) => void;
}) {
  const matches = useApi(() =>
    logisticsApi.matchRoutes({
      pickupLocation: query.pickupLocation,
      deliveryLocation: query.deliveryLocation,
      requiredCapacity: query.requiredCapacity,
      travelDate: query.travelDate ?? null,
    }),
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delivery options</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1">
            {query.pickupLocation.address || "Provider"}
            <ArrowRightIcon className="size-3" />
            {query.deliveryLocation.address || "You"} · {query.requiredCapacity} units
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {matches.error ? (
            <ErrorState error={matches.error} onRetry={matches.reload} />
          ) : !matches.data ? (
            <ListSkeleton rows={3} />
          ) : (() => {
            const routeList = Array.isArray(matches.data) ? matches.data : ((matches.data as unknown as { routes?: RouteMatch[] })?.routes ?? []);
            if (routeList.length === 0) {
              return (
                <EmptyState
                  icon={RouteIcon}
                  title="No drivers on this route yet"
                  description="Nobody has published a route that passes near both points on that date. The provider can still arrange delivery."
                />
              );
            }
            return (
              <ul className="flex flex-col gap-2">
                {routeList.map((match) => (
                  <li key={match.routeId} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <TruckIcon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{match.driver.name || "Driver"}</p>
                        <p className="text-xs text-muted-foreground">
                          {match.driver.vehicleType} · {match.availableCapacity} kg free
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{inr(match.price)}</p>
                      {match.driver.totalRatings ? (
                        <p className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                          <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                          {Number(match.driver.rating ?? 0).toFixed(1)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-normal">
                      {match.startLocation.address} → {match.destination.address}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {match.travelDate} · {match.departureTime}–{match.arrivalTime}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      +{match.total_detour_km} km detour
                    </Badge>
                    {!match.directionallyValid && (
                      <Badge variant="outline" className="border-amber-500/30 font-normal text-amber-600 dark:text-amber-400">
                        Opposite direction
                      </Badge>
                    )}
                  </div>
                </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
