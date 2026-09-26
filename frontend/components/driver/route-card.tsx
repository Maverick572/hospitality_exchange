import { ArrowRightIcon, CalendarIcon, ClockIcon, PackageIcon } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { inr, shortDate } from "@/lib/format";
import type { DriverRoute } from "@/lib/types";

/** "Thane → Vashi → Nerul" summary used on the dashboard and routes list. */
export function RoutePath({ route }: { route: DriverRoute }) {
  const points = [route.startLocation, ...(route.stops ?? []), route.destination].filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );
  return (
    <p className="flex flex-wrap items-center gap-1 font-semibold">
      {points.map((point, index) => (
        <span key={`${point.address}-${index}`} className="flex items-center gap-1">
          {index > 0 && <ArrowRightIcon className="size-3.5 text-muted-foreground" />}
          <span className={index > 0 && index < points.length - 1 ? "font-normal text-muted-foreground" : undefined}>
            {point.address}
          </span>
        </span>
      ))}
    </p>
  );
}

export function RouteMeta({ route }: { route: DriverRoute }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <CalendarIcon className="size-3.5" />
        {shortDate(route.travelDate)}
      </span>
      <span className="flex items-center gap-1">
        <ClockIcon className="size-3.5" />
        {route.departureTime} → {route.arrivalTime}
      </span>
      <span className="flex items-center gap-1">
        <PackageIcon className="size-3.5" />
        {route.availableCapacity} kg free
      </span>
      <span className="font-medium text-foreground">{inr(route.price)}</span>
      <StatusBadge status={route.status} />
    </div>
  );
}
