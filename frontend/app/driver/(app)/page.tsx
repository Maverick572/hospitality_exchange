"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  IndianRupeeIcon,
  Navigation2Icon,
  PlusIcon,
  RouteIcon,
  SparklesIcon,
  TruckIcon,
  WalletIcon,
} from "lucide-react";

import { RouteMeta, RoutePath } from "@/components/driver/route-card";
import { Page } from "@/components/page-header";
import { PanelLink } from "@/components/panel-link";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatFrameCard } from "@/components/ui/stat-frame-card";
import { useApi } from "@/hooks/use-api";
import { bookingsApi, dashboardApi, routesApi } from "@/lib/api";
import { firstName, inr, isoDate, shortDate } from "@/lib/format";
import { useDriverSession } from "@/lib/session";

export default function DriverDashboard() {
  const { profile } = useDriverSession();
  const stats = useApi(dashboardApi.getDriverDashboard);
  const routes = useApi(routesApi.getMine);
  const deliveries = useApi(() => bookingsApi.getMine({ role: "driver", status: "active" }));

  const today = isoDate();
  const upcoming = (routes.data ?? [])
    .filter((r) => r.status === "active" && r.travelDate >= today)
    .sort((a, b) => `${a.travelDate} ${a.departureTime}`.localeCompare(`${b.travelDate} ${b.departureTime}`))
    .slice(0, 3);

  return (
    <Page>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName(profile.name)}!</h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
            {profile.vehicleType} · {profile.vehicleNumber} · {profile.capacity} kg capacity
            {profile.verificationStatus !== "verified" && (
              <>
                {" "}
                · <StatusBadge status={profile.verificationStatus} className="align-middle" />
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/driver/routes?new=1">
            <PlusIcon data-icon="inline-start" />
            Publish route
          </Link>
        </Button>
      </div>

      {stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : !stats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-[1.375rem]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatFrameCard
            label="Active routes"
            value={String(stats.data.activeRoutes)}
            subValue={`${stats.data.matchedRequests} matched requests`}
            icon={RouteIcon}
          />
          <StatFrameCard
            label="Active deliveries"
            value={String(stats.data.activeDeliveries)}
            subValue={`${stats.data.completedDeliveries} completed`}
            icon={TruckIcon}
          />
          <StatFrameCard
            label="Total earnings"
            value={inr(stats.data.totalEarnings)}
            subValue="Released from escrow"
            icon={IndianRupeeIcon}
          />
          <StatFrameCard
            label="Pending payments"
            value={inr(stats.data.pendingPayments)}
            subValue="Paid once delivery is confirmed"
            icon={WalletIcon}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Upcoming routes" icon={RouteIcon} action={<PanelLink href="/driver/routes" />}>
          {routes.error ? (
            <div className="p-4">
              <ErrorState error={routes.error} onRetry={routes.reload} />
            </div>
          ) : !routes.data ? (
            <div className="p-4">
              <ListSkeleton rows={2} />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <p className="text-sm font-medium">No upcoming routes</p>
              <p className="text-xs text-muted-foreground">Publish a trip to start getting matched deliveries.</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/driver/routes?new=1">Publish route</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((route) => (
                <li key={route.routeId} className="flex flex-col gap-1.5 px-4 py-3">
                  <RoutePath route={route} />
                  <RouteMeta route={route} />
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Active deliveries" icon={TruckIcon} action={<PanelLink href="/driver/deliveries" />}>
          {deliveries.error ? (
            <div className="p-4">
              <ErrorState error={deliveries.error} onRetry={deliveries.reload} />
            </div>
          ) : !deliveries.data ? (
            <div className="p-4">
              <ListSkeleton rows={2} />
            </div>
          ) : deliveries.data.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <SparklesIcon className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">No active deliveries</p>
              <p className="text-xs text-muted-foreground">Open a route&apos;s matches to pick up a job.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {deliveries.data.slice(0, 4).map((booking) => (
                <li key={booking.bookingId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {booking.pickupLocation?.address ?? "Pickup"} → {booking.deliveryLocation?.address ?? "Drop-off"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(booking.deliveryDate)} · {inr(booking.deliveryAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={booking.status} />
                    <Button size="icon-xs" variant="ghost" asChild title="Open GPS Navigation" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                      <Link href={`/driver/navigation?bookingId=${booking.bookingId}`}>
                        <Navigation2Icon className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {stats.data && stats.data.completedDeliveries > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2Icon className="size-3.5 text-emerald-500" />
          {stats.data.completedDeliveries} deliveries completed so far.
        </p>
      )}
    </Page>
  );
}
