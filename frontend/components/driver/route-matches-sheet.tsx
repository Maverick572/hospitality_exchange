"use client";

import { useState } from "react";
import { ArrowDownIcon, CheckIcon, PackageSearchIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/use-api";
import { deliveriesApi, routesApi } from "@/lib/api";
import { humanize, inr } from "@/lib/format";
import type { DriverRoute } from "@/lib/types";

/** Route-matched delivery opportunities for one route (section 17). */
export function RouteMatchesSheet({
  route,
  onOpenChange,
  onAccepted,
}: {
  route: DriverRoute;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}) {
  const matches = useApi(() => routesApi.getMatches(route.routeId), [route.routeId]);
  const [accepting, setAccepting] = useState<string | null>(null);

  async function accept(id: string) {
    setAccepting(id);
    try {
      await deliveriesApi.accept(id);
      toast.success("Delivery accepted", { description: "It's now in your active deliveries." });
      void matches.reload();
      onAccepted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept the delivery.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Delivery opportunities</SheetTitle>
          <SheetDescription>
            {route.startLocation.address} → {route.destination?.address ?? route.endLocation?.address ?? "Destination"} · {route.travelDate}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {matches.error ? (
            <ErrorState error={matches.error} onRetry={matches.reload} />
          ) : !matches.data ? (
            <ListSkeleton rows={3} />
          ) : matches.data.length === 0 ? (
            <EmptyState
              icon={PackageSearchIcon}
              title="No matching deliveries yet"
              description="We'll notify you when a booking needs something moved along this route."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.data.map((job) => (
                <li key={job.deliveryRequestId} className="rounded-xl border bg-card p-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span className="size-2 rounded-full border-2 border-muted-foreground" />
                      <ArrowDownIcon className="my-0.5 size-3 text-muted-foreground" />
                      <span className="size-2 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate">{job.pickupLocation.address ?? "Pickup"}</p>
                      <p className="mt-2 truncate font-medium">{job.deliveryLocation.address ?? "Drop-off"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Earn</p>
                      <p className="font-semibold tabular-nums">{inr(job.estimatedEarnings)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="font-normal">
                        {job.requiredCapacity} kg
                      </Badge>
                      {job.compatibility && (
                        <Badge variant="outline" className="font-normal">
                          {humanize(job.compatibility)} fit
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void accept(job.deliveryRequestId)}
                      disabled={accepting === job.deliveryRequestId}
                    >
                      {accepting === job.deliveryRequestId ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                      Accept
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
