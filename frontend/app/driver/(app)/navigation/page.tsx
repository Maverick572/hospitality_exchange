"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  CompassIcon,
  MapPinIcon,
  Navigation2Icon,
  PlayIcon,
  PlusIcon,
  RouteIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";

import { GpsNavigationCockpit } from "@/components/driver/navigation/gps-cockpit";
import { Page, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type NavigationTarget,
  useDriverNavigation,
} from "@/contexts/driver-navigation-context";
import { useApi } from "@/hooks/use-api";
import { bookingsApi, routesApi } from "@/lib/api";
import { inr, shortDate } from "@/lib/format";

// Realistic sample Mumbai routes for instant demo testing
const DEMO_TEST_ROUTES: NavigationTarget[] = [
  {
    type: "sample",
    id: "demo_thane_vashi",
    title: "Thane APMC → Vashi Commercial Hub",
    earnings: 850,
    waypoints: [
      {
        address: "Kapurbawdi Junction, Thane West, Maharashtra",
        latitude: 19.2183,
        longitude: 72.9781,
        role: "pickup",
      },
      {
        address: "Turbhe Naka, Navi Mumbai",
        latitude: 19.0833,
        longitude: 73.0167,
        role: "stop",
      },
      {
        address: "Sector 19, Vashi APMC Market, Navi Mumbai",
        latitude: 19.0771,
        longitude: 72.9986,
        role: "delivery",
      },
    ],
  },
  {
    type: "sample",
    id: "demo_andheri_bkc",
    title: "Andheri MIDC → BKC Financial Centre",
    earnings: 620,
    waypoints: [
      {
        address: "MIDC Industrial Area, Andheri East, Mumbai",
        latitude: 19.1197,
        longitude: 72.8687,
        role: "pickup",
      },
      {
        address: "G Block, Bandra Kurla Complex (BKC), Mumbai",
        latitude: 19.0664,
        longitude: 72.8684,
        role: "delivery",
      },
    ],
  },
  {
    type: "sample",
    id: "demo_dadar_colaba",
    title: "Dadar Market → Colaba Waterfront",
    earnings: 740,
    waypoints: [
      {
        address: "Dadar Wholesale Flower Market, Mumbai",
        latitude: 19.0178,
        longitude: 72.8478,
        role: "pickup",
      },
      {
        address: "Gateway of India, Colaba, Mumbai",
        latitude: 18.922,
        longitude: 72.8347,
        role: "delivery",
      },
    ],
  },
];

function DriverNavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isNavigating, isMinimized, startNavigation, toggleMinimize } = useDriverNavigation();

  const deliveries = useApi(() => bookingsApi.getMine({ role: "driver", status: "active" }));
  const routes = useApi(routesApi.getMine);

  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const bookingIdParam = searchParams.get("bookingId");
  const routeIdParam = searchParams.get("routeId");

  // Auto-launch if bookingId or routeId is provided in URL
  useEffect(() => {
    if (hasAutoStarted || isNavigating) return;

    if (bookingIdParam && deliveries.data) {
      const match = deliveries.data.find((b) => b.bookingId === bookingIdParam);
      if (match?.pickupLocation && match.deliveryLocation) {
        setHasAutoStarted(true);
        void startNavigation({
          type: "booking",
          id: match.bookingId,
          title: `Delivery #${match.bookingId.slice(0, 8)}`,
          currentStatus: match.status as any,
          earnings: match.deliveryAmount,
          waypoints: [
            {
              address: match.pickupLocation.address ?? "Pickup",
              latitude: match.pickupLocation.latitude ?? 19.2183,
              longitude: match.pickupLocation.longitude ?? 72.9781,
              role: "pickup",
            },
            {
              address: match.deliveryLocation.address ?? "Delivery",
              latitude: match.deliveryLocation.latitude ?? 19.0771,
              longitude: match.deliveryLocation.longitude ?? 72.9986,
              role: "delivery",
            },
          ],
        });
      }
    } else if (routeIdParam && routes.data) {
      const match = routes.data.find((r) => r.routeId === routeIdParam);
      if (match) {
        setHasAutoStarted(true);
        const wps: NavigationTarget["waypoints"] = [
          {
            address: match.startLocation.address,
            latitude: match.startLocation.latitude ?? 19.2183,
            longitude: match.startLocation.longitude ?? 72.9781,
            role: "start",
          },
          ...(match.stops ?? []).map((s, idx) => ({
            address: s.address,
            latitude: s.latitude ?? 19.08,
            longitude: s.longitude ?? 73.0,
            role: "stop" as const,
          })),
          {
            address: match.destination?.address ?? "Destination",
            latitude: match.destination?.latitude ?? 19.0771,
            longitude: match.destination?.longitude ?? 72.9986,
            role: "destination",
          },
        ];
        void startNavigation({
          type: "route",
          id: match.routeId,
          title: `Route: ${match.startLocation.address} → ${match.destination?.address ?? "End"}`,
          waypoints: wps,
        });
      }
    }
  }, [
    bookingIdParam,
    routeIdParam,
    deliveries.data,
    routes.data,
    hasAutoStarted,
    isNavigating,
    startNavigation,
  ]);

  // If navigating in full-screen, render Cockpit
  if (isNavigating && !isMinimized) {
    return (
      <div className="h-[calc(100vh-5rem)] w-full p-2 md:p-4">
        <GpsNavigationCockpit />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Live OSM GPS Navigation"
        description="Real-time OpenStreetMap turn-by-turn guidance and route tracking for your accepted deliveries."
        actions={
          isNavigating && isMinimized ? (
            <Button onClick={toggleMinimize} className="gap-1.5 shadow-md">
              <Navigation2Icon className="size-4 text-emerald-400" />
              Resume Active GPS Cockpit
            </Button>
          ) : undefined
        }
      />

      {/* Demo Test Routes Section */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <SparklesIcon className="size-4" />
          <span>Demo & Hackathon Test Routes</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Instantly test turn-by-turn navigation, simulation controls (1x, 2x, 5x), and live OSRM routing in Mumbai:
        </p>

        <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
          {DEMO_TEST_ROUTES.map((demo) => (
            <div
              key={demo.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-primary/50"
            >
              <div>
                <p className="text-sm font-bold text-foreground">{demo.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {demo.waypoints[0].address} &rarr; {demo.waypoints[demo.waypoints.length - 1].address}
                </p>
                {demo.earnings && (
                  <span className="mt-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Est. {inr(demo.earnings)}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => void startNavigation(demo)}
                className="w-full gap-1.5 font-semibold shadow-xs"
              >
                <PlayIcon className="size-3.5 fill-current" />
                Launch GPS Simulation
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Deliveries */}
        <ChartCard
          title="Active Deliveries"
          icon={TruckIcon}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/driver/deliveries")}
            >
              View all
            </Button>
          }
        >
          {!deliveries.data ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : deliveries.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <TruckIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No active deliveries</p>
              <p className="text-xs text-muted-foreground">
                Accepted deliveries appear here with one-click GPS guidance.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {deliveries.data.map((b) => (
                <div key={b.bookingId} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {b.pickupLocation?.address ?? "Pickup"} &rarr; {b.deliveryLocation?.address ?? "Drop-off"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(b.deliveryDate)} &bull; {inr(b.deliveryAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={b.status} />
                    <Button
                      size="sm"
                      onClick={() =>
                        void startNavigation({
                          type: "booking",
                          id: b.bookingId,
                          title: `Delivery #${b.bookingId.slice(0, 8)}`,
                          currentStatus: b.status as any,
                          earnings: b.deliveryAmount,
                          waypoints: [
                            {
                              address: b.pickupLocation?.address ?? "Pickup",
                              latitude: b.pickupLocation?.latitude ?? 19.2183,
                              longitude: b.pickupLocation?.longitude ?? 72.9781,
                              role: "pickup",
                            },
                            {
                              address: b.deliveryLocation?.address ?? "Delivery",
                              latitude: b.deliveryLocation?.latitude ?? 19.0771,
                              longitude: b.deliveryLocation?.longitude ?? 72.9986,
                              role: "delivery",
                            },
                          ],
                        })
                      }
                      className="gap-1 font-semibold shadow-xs"
                    >
                      <Navigation2Icon className="size-3.5" />
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Published Routes */}
        <ChartCard
          title="Published Routes"
          icon={RouteIcon}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/driver/routes")}
            >
              View all
            </Button>
          }
        >
          {!routes.data ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : routes.data.filter((r) => r.status === "active").length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <RouteIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No published routes</p>
              <p className="text-xs text-muted-foreground">
                Publish a route with available space to guide trips.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {routes.data
                .filter((r) => r.status === "active")
                .slice(0, 4)
                .map((r) => (
                  <div key={r.routeId} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {r.startLocation.address} &rarr; {r.destination?.address ?? "End"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shortDate(r.travelDate)} &bull; {r.departureTime} &bull; {r.availableCapacity} kg capacity
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void startNavigation({
                          type: "route",
                          id: r.routeId,
                          title: `Route: ${r.startLocation.address} → ${r.destination?.address ?? "End"}`,
                          waypoints: [
                            {
                              address: r.startLocation.address,
                              latitude: r.startLocation.latitude ?? 19.2183,
                              longitude: r.startLocation.longitude ?? 72.9781,
                              role: "start",
                            },
                            ...(r.stops ?? []).map((s, idx) => ({
                              address: s.address,
                              latitude: s.latitude ?? 19.08,
                              longitude: s.longitude ?? 73.0,
                              role: "stop" as const,
                            })),
                            {
                              address: r.destination?.address ?? "End",
                              latitude: r.destination?.latitude ?? 19.0771,
                              longitude: r.destination?.longitude ?? 72.9986,
                              role: "destination",
                            },
                          ],
                        })
                      }
                      className="gap-1 font-semibold"
                    >
                      <Navigation2Icon className="size-3.5" />
                      Navigate
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </ChartCard>
      </div>
    </Page>
  );
}

export default function DriverNavigationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading GPS Navigation...</div>}>
      <DriverNavigationContent />
    </Suspense>
  );
}
