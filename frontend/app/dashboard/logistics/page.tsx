"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  BoxesIcon,
  CheckCircle2Icon,
  ClockIcon,
  LayersIcon,
  LeafIcon,
  Loader2Icon,
  MapPinIcon,
  PackageXIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StoreIcon,
  TrendingDownIcon,
  TruckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { CostComparison } from "@/components/logistics/cost-comparison";
import { Button } from "@/components/ui/button";
import { useBusinessSession } from "@/lib/session";
import { usePerspective } from "@/lib/perspective";
import { bookingsApi, logisticsApi, notificationsApi, requestsApi } from "@/lib/api";
import { resolveBusinessUid } from "@/lib/business-uids";

type PooledDriver = {
  routeId?: string;
  driverId?: string;
  driverName: string;
  vehicleType: string;
  vehicleNumber: string;
  rating?: number;
  vehicleCapacity?: number;
  availableCapacity: number;
  allocatedUnits: number;
  allocatedPrice: number;
  departureTime: string;
  arrivalTime: string;
  startAddress?: string;
  destinationAddress?: string;
  detourKm?: number;
  directionallyValid?: boolean;
};

type PooledSolution = {
  poolId: string;
  totalDemand: number;
  totalAllocated: number;
  remainingUnfulfilled: number;
  fulfillmentPercentage: number;
  isFullyFulfilled: boolean;
  vehicleCount: number;
  totalPrice: number;
  dedicatedTripCost: number;
  totalSavings: number;
  savingsPercentage: number;
  co2ReductionKg: number;
  osmDistanceKm: number;
  osmDurationMinutes: number;
  routingSource: string;
  drivers: PooledDriver[];
};

type RouteMatch = {
  routeId: string;
  driver?: {
    driverId?: string;
    name?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    rating?: number;
    capacity?: number;
  };
  startLocation?: { address?: string; latitude?: number; longitude?: number };
  destination?: { address?: string; latitude?: number; longitude?: number };
  stops?: { address?: string; latitude?: number; longitude?: number }[];
  travelDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  availableCapacity?: number;
  requiredCapacity?: number;
  unitsFitted?: number;
  remainingUnits?: number;
  capacityFulfillment?: "full" | "partial" | string;
  osmDistanceKm?: number;
  osmDurationMinutes?: number;
  routingSource?: string;
  price?: number;
  pickup_detour_km?: number;
  delivery_detour_km?: number;
  total_detour_km?: number;
  routeOverlap?: number;
  directionallyValid?: boolean;
  pooledSolution?: PooledSolution;
};

function shortAddr(addr?: string): string {
  if (!addr) return "Mumbai";
  const parts = addr.split(",").map((s) => s.trim());
  return parts[0] || "Mumbai";
}

function getVehicleImage(type?: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("eicher") || t.includes("truck") || t.includes("14ft")) {
    return "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80";
  }
  if (t.includes("407") || t.includes("dost")) {
    return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80";
  }
  if (t.includes("bolero") || t.includes("pickup")) {
    return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80";
  }
  if (t.includes("ape") || t.includes("tempo") || t.includes("3-wheeler")) {
    return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80";
  }
  return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80";
}

function LogisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickupParam = searchParams.get("pickup");
  const deliveryParam = searchParams.get("delivery");
  const pickupLatParam = searchParams.get("pickupLat");
  const pickupLngParam = searchParams.get("pickupLng");
  const deliveryLatParam = searchParams.get("deliveryLat");
  const deliveryLngParam = searchParams.get("deliveryLng");
  const quantityParam = searchParams.get("quantity");
  const isDemo = searchParams.get("demo") === "true";
  const resourceIdParam = searchParams.get("resourceId");
  const bookingIdParam = searchParams.get("bookingId");
  const requestIdParam = searchParams.get("requestId");

  const hasExplicitParams = Boolean(
    (pickupParam && deliveryParam) ||
    resourceIdParam ||
    bookingIdParam ||
    requestIdParam ||
    isDemo
  );

  const [checkingActiveOrders, setCheckingActiveOrders] = useState(!hasExplicitParams);
  const [hasActiveOrderOrSale, setHasActiveOrderOrSale] = useState(hasExplicitParams);

  const requiredQty = quantityParam ? Math.max(1, parseInt(quantityParam, 10)) : 300;

  const { perspective, setPerspective } = usePerspective();
  const { profile } = useBusinessSession();

  const currentBusinessName = profile?.businessName || profile?.name || "Taj Lands End";
  const currentAddress = profile?.location?.address || profile?.address || "Taj Lands End, Bandra West, Mumbai 400050";
  const counterpartName = currentBusinessName.toLowerCase().includes("jio")
    ? "Taj Lands End"
    : "Jio World Centre";
  const counterpartAddress = currentBusinessName.toLowerCase().includes("jio")
    ? "Taj Lands End, Bandra West, Mumbai 400050"
    : "Jio World Centre, G Block, BKC, Mumbai 400098";

  const isSeeker = perspective === "seeker";
  const [confirmed, setConfirmed] = useState(false);
  const [routes, setRoutes] = useState<RouteMatch[]>([]);
  const [pool, setPool] = useState<PooledSolution | null>(null);
  const [activeTab, setActiveTab] = useState<"pooled" | "individual">("pooled");
  const [loading, setLoading] = useState(hasExplicitParams);

  // Check if current user has any active/pending bookings or requests
  useEffect(() => {
    if (hasExplicitParams) {
      setHasActiveOrderOrSale(true);
      setCheckingActiveOrders(false);
      return;
    }

    let cancelled = false;
    async function checkUserOrders() {
      setCheckingActiveOrders(true);
      try {
        const [bookings, requests] = await Promise.all([
          bookingsApi.getMine().catch(() => []),
          requestsApi.getProviderRequests().catch(() => []),
        ]);
        if (!cancelled) {
          const activeBookings = Array.isArray(bookings) && bookings.length > 0;
          const activeRequests = Array.isArray(requests) && requests.length > 0;
          setHasActiveOrderOrSale(activeBookings || activeRequests);
        }
      } catch {
        if (!cancelled) setHasActiveOrderOrSale(false);
      } finally {
        if (!cancelled) setCheckingActiveOrders(false);
      }
    }

    checkUserOrders();
    return () => {
      cancelled = true;
    };
  }, [hasExplicitParams]);

  // In Seeker View: Surplus goods are picked up at Seller's venue, delivered to YOUR venue.
  // In Provider View: Goods are picked up at YOUR venue, delivered to Buyer's venue.
  const resolvedPickup = pickupParam ?? (isSeeker ? counterpartAddress : currentAddress);
  const resolvedDelivery = deliveryParam ?? (isSeeker ? currentAddress : counterpartAddress);

  // Fetch matched routes and multi-driver pooling solution from CP-SAT backend using OSM
  useEffect(() => {
    if (!hasActiveOrderOrSale || checkingActiveOrders) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchRoutes() {
      setLoading(true);
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const pLat = pickupLatParam ? parseFloat(pickupLatParam) : (isSeeker ? 19.0588 : 19.044);
        const pLng = pickupLngParam ? parseFloat(pickupLngParam) : (isSeeker ? 72.8653 : 72.821);
        const dLat = deliveryLatParam ? parseFloat(deliveryLatParam) : (isSeeker ? 19.044 : 19.0588);
        const dLng = deliveryLngParam ? parseFloat(deliveryLngParam) : (isSeeker ? 72.821 : 72.8653);

        const data = await logisticsApi.matchRoutes({
          pickupLocation: {
            address: resolvedPickup,
            latitude: pLat,
            longitude: pLng,
          },
          deliveryLocation: {
            address: resolvedDelivery,
            latitude: dLat,
            longitude: dLng,
          },
          requiredCapacity: requiredQty,
          travelDate: tomorrow.toISOString().slice(0, 10),
        });

        if (!cancelled) {
          const rawList = Array.isArray(data) ? data : ((data as unknown as { routes?: RouteMatch[] })?.routes ?? []);
          const poolData: PooledSolution | null =
            (Array.isArray(data)
              ? (data[0] as unknown as { pooledSolution?: PooledSolution })?.pooledSolution
              : (data as unknown as { pooledSolution?: PooledSolution })?.pooledSolution) ?? null;

          setRoutes(rawList);
          setPool(poolData);
          if (poolData && poolData.vehicleCount > 1) {
            setActiveTab("pooled");
          } else {
            setActiveTab("pooled");
          }
        }
      } catch (e) {
        console.error("Logistics match error:", e);
        if (!cancelled) {
          setRoutes([]);
          setPool(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRoutes();
    return () => {
      cancelled = true;
    };
  }, [hasActiveOrderOrSale, checkingActiveOrders, resolvedPickup, resolvedDelivery, pickupLatParam, pickupLngParam, deliveryLatParam, deliveryLngParam, requiredQty, isSeeker]);

  const topRoute = routes[0];

  const handleConfirm = () => {
    if (perspective === "provider") {
      toast.error("Switch to Seeker View to confirm logistics dispatch.");
      return;
    }
    setConfirmed(true);
    toast.success("Booking proposal initiated! Opening negotiation chat...", { icon: "🤝" });

    const buyerName = isSeeker ? currentBusinessName : counterpartName;
    const sellerName = isSeeker ? counterpartName : currentBusinessName;
    const reqId = `request_${Date.now()}`;
    const depTime = pool?.drivers?.[0]?.departureTime ?? topRoute?.departureTime ?? "08:15";
    const arrTime = pool?.drivers?.[0]?.arrivalTime ?? topRoute?.arrivalTime ?? "08:42";
    const totalProposedPrice = activeTab === "pooled" && pool ? pool.totalPrice : (topRoute?.price ?? 4250);

    // Dispatch real notification to seller immediately
    const sellerUid = resolveBusinessUid(sellerName);
    void notificationsApi.create({
      userId: sellerUid,
      type: "REQUEST_RECEIVED",
      title: `New Booking Proposal from ${buyerName}`,
      message: `Requested ${requiredQty} units with pickup at ${sellerName}. Transit: Departure ${depTime} → Arrival ${arrTime} (₹${totalProposedPrice.toLocaleString("en-IN")}).`,
      referenceId: reqId,
    }).catch(() => undefined);

    const params = new URLSearchParams({
      requestId: reqId,
      resource: `${requiredQty} × Cushioned Banquet Chairs (Co-loaded Route)`,
      qty: String(requiredQty),
      amount: String(totalProposedPrice),
      provider: resolvedPickup,
      providerName: sellerName,
      seeker: resolvedDelivery,
      seekerName: buyerName,
      dep: depTime,
      arr: arrTime,
      category: "banquet_seating",
      evidenceType: "photo",
      vehicles: String(pool?.vehicleCount ?? 3),
    });
    setTimeout(() => {
      router.push(`/dashboard/conversations?${params.toString()}`);
    }, 900);
  };

  const dedicatedCost = pool?.dedicatedTripCost ?? 8000;
  const sharedCost = activeTab === "pooled" && pool ? pool.totalPrice : (topRoute?.price ?? 1500);
  if (checkingActiveOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Checking active orders & logistics status...</p>
      </div>
    );
  }

  if (!hasActiveOrderOrSale && !hasExplicitParams) {
    return (
      <div className="space-y-6 pb-16">
        {/* Page Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tracking-wide mb-3">
            <TruckIcon className="size-3.5" />
            <span>MULTI-CARRIER LOGISTICS POOLING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Logistics Match & Fleet Pooling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            AI-powered carrier pooling and corridor matching to eliminate dedicated freight charges and deadhead miles.
          </p>
        </div>

        {/* Empty State Card */}
        <div className="rounded-3xl border border-border bg-gradient-to-b from-card via-card to-card/60 p-8 sm:p-12 text-center shadow-xs space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-xs">
            <PackageXIcon className="size-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              No Active Logistics Dispatches
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You haven't ordered or sold any hospitality surplus items yet. 
              Our multi-carrier CP-SAT solver and cost-cut calculations automatically activate when you source resources in the Marketplace or accept an incoming order.
            </p>
          </div>

          {/* Three Feature Pillars Explaining the Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left pt-2">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <LayersIcon className="size-4 text-emerald-500" />
                <span>Multi-Driver Pooling</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Aggregates verified carriers (Eicher Pro, Tata 407, Bolero Maxi) along existing commercial routes to fulfill your exact demand.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <TrendingDownIcon className="size-4 text-primary" />
                <span>Algorithmic Cost Cuts</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Co-loading on return legs slashes freight overhead by up to 80% compared to private dedicated truck bookings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <LeafIcon className="size-4 text-emerald-600" />
                <span>Green Mile Optimization</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Calculates real-time OSRM turn-by-turn road geometry, reducing carbon emissions and eliminating empty return miles.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button asChild size="default" className="text-xs font-bold gap-1.5">
              <Link href="/dashboard/marketplace">
                <StoreIcon className="size-3.5" />
                <span>Browse Marketplace</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="text-xs font-bold gap-1.5">
              <Link href="/dashboard/smart-matches">
                <SparklesIcon className="size-3.5 text-primary" />
                <span>View Smart Matches</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="text-xs font-bold gap-1.5">
              <Link href="/dashboard/resources">
                <BoxesIcon className="size-3.5" />
                <span>List Surplus to Sell</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push("/dashboard/logistics?demo=true")}
              className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
            >
              <span>Simulate Sample Route Fleet</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mb-3">
          <TruckIcon className="size-3.5" />
          <span>MULTI-CARRIER LOGISTICS POOLING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Logistics-Aware Fleet Pooling
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {pool
            ? `CP-SAT optimization pooled ${pool.vehicleCount} verified Mumbai carrier${pool.vehicleCount > 1 ? "s" : ""} to accommodate all ${pool.totalAllocated} units of your demand on existing corridors, saving ${pool.savingsPercentage}% vs private dedicated transport.`
            : "Calculating compatible vehicle corridors and solving multi-driver fleet pooling with OpenStreetMap..."}
        </p>
      </div>

      {/* ── Provider Mode Alert Banner ── */}
      {perspective === "provider" && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <ShieldAlertIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Provider View Active:</strong> Logistics routing and carrier dispatch is reserved for event sourcing. Switch to <strong>Seeker View</strong> to dispatch transport.
            </span>
          </div>
          <Button
            size="xs"
            onClick={() => {
              setPerspective("seeker");
              toast.success("Switched to Seeker View");
            }}
            className="shrink-0 text-xs font-semibold cursor-pointer"
          >
            Switch to Seeker View
          </Button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="size-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-sm font-medium text-muted-foreground">Running CP-SAT multi-vehicle pooling optimization...</span>
        </div>
      )}

      {/* ── No Routes ── */}
      {!loading && routes.length === 0 && !pool && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-base font-semibold text-foreground">No compatible routes found.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No active driver routes pass within 25km of both your pickup and delivery locations for the selected travel date.
          </p>
        </div>
      )}

      {/* ── View Toggle (Pooled Fleet vs Single Carrier) ── */}
      {!loading && pool && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pooled")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "pooled"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <LayersIcon className="size-3.5" />
              <span>Coordinated Multi-Driver Fleet ({pool.vehicleCount} Vehicles • 100% Demand Fit)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "individual"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <TruckIcon className="size-3.5" />
              <span>Single Driver Options ({routes.length} Available)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2Icon className="size-3.5" />
            <span>Demand: {requiredQty} units accommodated</span>
          </div>
        </div>
      )}

      {/* ── TAB 1: POOLED MULTI-DRIVER FLEET SOLUTION ── */}
      {!loading && pool && activeTab === "pooled" && (
        <div className="space-y-6">
          {/* Main Pooled Fleet Card */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                    Multi-Driver Co-Loading Pool
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Plan #{pool.poolId}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                  Coordinated {pool.vehicleCount}-Vehicle Co-Loading Fleet
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Demand: <strong className="text-foreground">{pool.totalDemand} units</strong> • Fulfilled: <strong className="text-emerald-600 dark:text-emerald-400">{pool.totalAllocated} units ({pool.fulfillmentPercentage}%)</strong> across {pool.vehicleCount} synchronized Mumbai carriers.
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pooled Cost</span>
                <span className="text-2xl md:text-3xl font-black text-foreground">₹{pool.totalPrice.toLocaleString("en-IN")}</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Save ₹{pool.totalSavings.toLocaleString("en-IN")} ({pool.savingsPercentage}% vs private dedicated truck)
                </span>
              </div>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-border">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <LayersIcon className="size-4 text-emerald-500" />
                  <span>Fleet Coordination</span>
                </div>
                <p className="text-lg font-extrabold text-foreground">{pool.vehicleCount} Vehicles Pooled</p>
                <p className="text-[11px] text-muted-foreground">Shared corridor co-loading</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <CheckCircle2Icon className="size-4 text-emerald-500" />
                  <span>Capacity Coverage</span>
                </div>
                <p className="text-lg font-extrabold text-foreground">{pool.totalAllocated} / {pool.totalDemand} units</p>
                <p className="text-[11px] text-emerald-600 font-semibold">100% single-trip fulfillment</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <ClockIcon className="size-4 text-blue-500" />
                  <span>OSM Road Transit</span>
                </div>
                <p className="text-lg font-extrabold text-foreground">{pool.osmDistanceKm} km • ~{pool.osmDurationMinutes}m</p>
                <p className="text-[11px] text-muted-foreground">OpenStreetMap dynamic route</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <LeafIcon className="size-4 text-emerald-500" />
                  <span>Green Logistics</span>
                </div>
                <p className="text-lg font-extrabold text-foreground">{pool.co2ReductionKg} kg CO₂ saved</p>
                <p className="text-[11px] text-muted-foreground">Zero empty return miles</p>
              </div>
            </div>

            {/* Fleet Convoy Visualizer */}
            <div className="py-8">
              <h3 className="text-center text-sm font-bold tracking-tight text-foreground mb-6">
                Synchronized Fleet Transit Schedule
              </h3>

              <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 md:flex-row md:gap-0">
                {/* Connecting Line (Desktop) */}
                <div className="pointer-events-none absolute left-[15%] right-[15%] top-1/2 hidden -translate-y-1/2 md:block overflow-hidden opacity-30">
                  <svg width="100%" height="6" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="3" x2="100%" y2="3" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8" className="text-emerald-500 animate-pulse" />
                  </svg>
                </div>

                {/* Node 1: Origin */}
                <div className="z-10 flex w-56 flex-col items-center text-center">
                  <div className="relative mb-3 size-20 overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                      alt="Origin"
                      className="size-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{shortAddr(resolvedPickup ?? pool.drivers[0]?.startAddress)}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Origin ({isSeeker ? `${counterpartName} Hub` : "Your Loading Bay"})</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                    Departure: {pool.drivers[0]?.departureTime ?? "09:00"}
                  </div>
                </div>

                {/* Mobile Arrow */}
                <div className="text-muted-foreground md:hidden">
                  <ArrowRightIcon className="size-5 rotate-90" />
                </div>

                {/* Node 2: Coordinated Convoy */}
                <div className="z-10 flex flex-col items-center text-center">
                  <div className="relative mb-2 flex -space-x-4">
                    {pool.drivers.map((drv, i) => (
                      <div
                        key={drv.routeId || i}
                        className="relative size-16 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-card shadow-md transition-transform hover:scale-110 hover:z-20"
                      >
                        <img
                          src={getVehicleImage(drv.vehicleType)}
                          alt={drv.vehicleType}
                          className="size-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-emerald-600 text-[9px] font-black text-white px-1 rounded-tl-md">
                          {drv.allocatedUnits}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {pool.vehicleCount} Vehicles In-Transit Convoy
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {pool.osmDistanceKm} km road distance • ~{pool.osmDurationMinutes}m transit
                  </p>
                </div>

                {/* Mobile Arrow */}
                <div className="text-muted-foreground md:hidden">
                  <ArrowRightIcon className="size-5 rotate-90" />
                </div>

                {/* Node 3: Destination */}
                <div className="z-10 flex w-56 flex-col items-center text-center">
                  <div className="relative mb-3 size-20 overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80"
                      alt="Destination"
                      className="size-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{shortAddr(resolvedDelivery ?? pool.drivers[0]?.destinationAddress)}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Destination ({isSeeker ? "Your Event Venue" : `${counterpartName} Venue`})</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                    Arrival: {pool.drivers[0]?.arrivalTime ?? "09:30"}
                  </div>
                </div>
              </div>
            </div>

            {/* Pooled Carrier Breakdown Grid */}
            <div className="mt-4 pt-6 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Assigned Vehicles & Cargo Allocation Breakdown ({pool.vehicleCount} Carriers)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pool.drivers.map((drv, idx) => (
                  <div
                    key={drv.routeId || idx}
                    className="p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-10 rounded-xl overflow-hidden border border-border shrink-0">
                            <img
                              src={getVehicleImage(drv.vehicleType)}
                              alt={drv.vehicleType}
                              className="size-full object-cover"
                            />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-foreground">{drv.driverName}</h5>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {drv.vehicleType}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-foreground">
                          ₹{drv.allocatedPrice.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Plate: <strong className="text-foreground">{drv.vehicleNumber}</strong></span>
                          <span>Rating: <strong className="text-amber-500">★ {drv.rating?.toFixed(1) ?? "4.8"}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Corridor:</span>
                          <span className="text-foreground font-medium truncate max-w-[170px]">
                            {shortAddr(drv.startAddress)} → {shortAddr(drv.destinationAddress)}
                          </span>
                        </div>
                      </div>

                      {/* Cargo Allocation Progress Bar */}
                      <div className="mt-3.5 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Carrying {drv.allocatedUnits} units
                          </span>
                          <span className="text-muted-foreground">
                            {drv.allocatedUnits} of {drv.availableCapacity} spare units
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((drv.allocatedUnits / Math.max(1, drv.availableCapacity)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 text-[10px] text-muted-foreground">
                      <span>Departure: <strong className="text-foreground">{drv.departureTime}</strong></span>
                      <span>Arrival: <strong className="text-foreground">{drv.arrivalTime}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Dispatch Bar */}
            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">⚡ Coordinated Dispatch:</span> All {pool.vehicleCount} drivers receive synchronized waypoints with escrow guarantee.
              </div>
              <Button
                size="lg"
                onClick={handleConfirm}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 shadow-md cursor-pointer"
              >
                Proceed to Book & Open Encrypted Chat (₹{pool.totalPrice.toLocaleString("en-IN")})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INDIVIDUAL CANDIDATE ROUTES ── */}
      {!loading && (activeTab === "individual" || !pool) && (
        <div className="space-y-6">
          {topRoute && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs">
              <h3 className="text-center text-base md:text-lg font-bold tracking-tight text-foreground mb-6">
                Top Individual Route Match
              </h3>

              <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 md:flex-row md:gap-0 py-4">
                {/* Node 1 */}
                <div className="z-10 flex w-56 flex-col items-center text-center">
                  <div className="relative mb-3 size-20 overflow-hidden rounded-2xl border border-border bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                      alt="Origin"
                      className="size-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{shortAddr(resolvedPickup ?? topRoute.startLocation?.address)}</h4>
                  <p className="text-[11px] text-muted-foreground">Origin ({isSeeker ? `${counterpartName} Hub` : "Your Loading Bay"})</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                    Departure: {topRoute.departureTime ?? "09:00"}
                  </div>
                </div>

                <div className="text-muted-foreground md:hidden">
                  <ArrowRightIcon className="size-5 rotate-90" />
                </div>

                {/* Node 2 */}
                <div className="z-10 flex w-60 flex-col items-center text-center">
                  <div className="relative mb-3 size-20 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-muted">
                    <img
                      src={getVehicleImage(topRoute.driver?.vehicleType)}
                      alt="Vehicle"
                      className="size-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {topRoute.driver?.name ?? "Driver"} — {topRoute.driver?.vehicleType ?? "Vehicle"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {topRoute.driver?.vehicleNumber ?? ""}
                  </p>
                  <div className="mt-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {(topRoute.availableCapacity ?? 0) >= requiredQty ? (
                      <span>Fits all {requiredQty} units</span>
                    ) : (
                      <span>{topRoute.availableCapacity} of {requiredQty} units fit ({topRoute.remainingUnits} remain)</span>
                    )}
                  </div>
                </div>

                <div className="text-muted-foreground md:hidden">
                  <ArrowRightIcon className="size-5 rotate-90" />
                </div>

                {/* Node 3 */}
                <div className="z-10 flex w-56 flex-col items-center text-center">
                  <div className="relative mb-3 size-20 overflow-hidden rounded-2xl border border-border bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80"
                      alt="Destination"
                      className="size-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{shortAddr(resolvedDelivery ?? topRoute.destination?.address)}</h4>
                  <p className="text-[11px] text-muted-foreground">Destination ({isSeeker ? "Your Event Venue" : `${counterpartName} Venue`})</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                    Arrival: {topRoute.arrivalTime ?? "09:30"}
                  </div>
                </div>
              </div>

              {/* Single Route Cost Comparison */}
              <div className="mt-6 pt-6 border-t border-border">
                <CostComparison
                  perspective={perspective}
                  onConfirm={handleConfirm}
                  dedicatedCost={dedicatedCost}
                  sharedCost={topRoute.price ?? 1500}
                  resourceName={topRoute.driver?.vehicleType ?? "Delivery Vehicle"}
                  routeDescription={`${shortAddr(topRoute.startLocation?.address)} → ${shortAddr(topRoute.destination?.address)}`}
                />
              </div>
            </div>
          )}

          {/* All Available Routes Grid */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">
              All Active Transport Corridors ({routes.length} Carriers)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route) => (
                <div
                  key={route.routeId}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl overflow-hidden border border-border shrink-0">
                      <img
                        src={getVehicleImage(route.driver?.vehicleType)}
                        alt={route.driver?.vehicleType}
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {route.driver?.name ?? "Driver"} — {route.driver?.vehicleType ?? "Vehicle"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {shortAddr(route.startLocation?.address)} → {shortAddr(route.destination?.address)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Spare Capacity: <strong className="text-foreground">{route.availableCapacity ?? 0} units</strong> • {route.total_detour_km?.toFixed(1) ?? "—"} km detour
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-foreground">₹{(route.price ?? 0).toLocaleString("en-IN")}</p>
                    {route.routeOverlap != null && (
                      <span className="text-[11px] font-bold text-emerald-600">{Math.round(route.routeOverlap * 100)}% overlap</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground p-4 text-xs font-semibold text-background shadow-lg">
          ✓ Booking request with co-loaded route dispatched! Opening encrypted conversations...
        </div>
      )}
    </div>
  );
}

export default function LogisticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LogisticsContent />
    </Suspense>
  );
}
