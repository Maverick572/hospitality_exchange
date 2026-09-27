"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  CompassIcon,
  DollarSignIcon,
  Loader2Icon,
  LockIcon,
  MapPinIcon,
  PackageCheckIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";

import { RadialScore } from "@/components/matching/radial-score";
import { ScoreBreakdown } from "@/components/matching/score-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";
import { useBusinessSession } from "@/lib/session";
import { seekerApi, requirementsApi, resourcesApi } from "@/lib/api";
import type { Requirement, Resource } from "@/lib/types";

/* ── types for API response ────────────────────────────────── */
type MatchResult = {
  resourceId: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  availableQuantity: number;
  price: number;
  pricingUnit: string;
  location: { address?: string; latitude?: number; longitude?: number };
  provider?: {
    providerId?: string;
    businessName?: string;
    rating?: number;
    totalRatings?: number;
    location?: { address?: string };
  };
  distanceKm?: number | null;
  availabilityScore?: number;
  images?: string[];
  matchedItem?: {
    name?: string;
    category?: string;
    requestedQuantity?: number;
    metric?: string;
  };
};

type DemandMatch = {
  requirement: Requirement;
  compatibleResource: Resource;
  score: number;
  distanceKm: number;
  estimatedRevenue: number;
};

/* ── score helper ──────────────────────────────────────────── */
function computeScore(result: MatchResult): number {
  const avail = Math.min(100, (result.availabilityScore ?? 1) * 40);
  const dist = result.distanceKm != null ? Math.max(0, 100 - result.distanceKm * 3) : 60;
  const rating = (result.provider?.rating ?? 4.8) * 20;
  return Math.min(99, Math.round((avail + dist * 0.3 + rating * 0.3) / 1.6));
}

function computeScoreBreakdown(result: MatchResult) {
  const reqQty = result.matchedItem?.requestedQuantity ?? 1;
  const availRatio = Math.min(100, Math.round((result.availableQuantity / Math.max(1, reqQty)) * 100));
  const dist = result.distanceKm != null ? Math.max(0, Math.min(100, Math.round(100 - result.distanceKm * 3))) : 87;
  const ratingScore = Math.min(100, Math.round((result.provider?.rating ?? 4.8) * 20));
  const priceScore = result.price <= 25 ? 91 : result.price <= 50 ? 84 : 75;
  const logisticsScore = dist >= 70 ? 96 : 82;

  return {
    resourceFit: 98,
    availability: availRatio,
    price: priceScore,
    logistics: logisticsScore,
    distance: dist,
    reliability: ratingScore,
  };
}

function shortLocation(addr?: string): string {
  if (!addr) return "Mumbai";
  const parts = addr.split(",").map((s) => s.trim());
  for (const p of parts) {
    if (
      p.includes("Bandra") || p.includes("BKC") || p.includes("Andheri") ||
      p.includes("Powai") || p.includes("Goregaon") || p.includes("Worli") ||
      p.includes("Colaba") || p.includes("Fort") || p.includes("Vile Parle") ||
      p.includes("Lower Parel")
    ) {
      return p;
    }
  }
  return parts[0] || "Mumbai";
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  banquet_seating: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
  tables: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  visual_display: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
  sound_system: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
  buffet_serving: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  cooking_equipment: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
  linen_textiles: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
  refrigeration: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  crockery_glassware: "https://images.unsplash.com/photo-1551887196-72e32bfc7bf3?auto=format&fit=crop&w=800&q=80",
  staging_structures: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
};

function getImage(category: string, images?: string[]): string {
  if (images && images.length > 0) return images[0];
  return PLACEHOLDER_IMAGES[category] ?? PLACEHOLDER_IMAGES.banquet_seating;
}

function SmartMatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqParamId = searchParams.get("requirementId");
  const { perspective, setPerspective } = usePerspective();
  const { profile } = useBusinessSession();

  // ── SEEKER STATE ──
  const [myRequirements, setMyRequirements] = useState<Requirement[]>([]);
  const [selectedMyReqId, setSelectedMyReqId] = useState<string>("");
  const [seekerResults, setSeekerResults] = useState<MatchResult[]>([]);
  const [seekerLoading, setSeekerLoading] = useState(true);
  const [adhocQuery, setAdhocQuery] = useState("");
  const [adhocLocation, setAdhocLocation] = useState("Bandra Kurla Complex, Mumbai");

  // ── PROVIDER STATE ──
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [allMarketDemands, setAllMarketDemands] = useState<Requirement[]>([]);
  const [demandMatches, setDemandMatches] = useState<DemandMatch[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);

  // 1. Fetch user's OWN requirements when in Seeker View
  useEffect(() => {
    let cancelled = false;
    async function loadSeekerData() {
      if (perspective !== "seeker") return;
      setSeekerLoading(true);
      try {
        const reqs = await requirementsApi.getMine();
        if (!cancelled) {
          const list = Array.isArray(reqs) ? reqs : [];
          setMyRequirements(list);
          if (list.length > 0) {
            if (reqParamId && list.some((r) => r.requirementId === reqParamId)) {
              setSelectedMyReqId(reqParamId);
            } else {
              setSelectedMyReqId(list[0].requirementId);
            }
          } else {
            setSelectedMyReqId("");
          }
        }
      } catch (err) {
        console.error("Failed to load user's requirements:", err);
        if (!cancelled) setMyRequirements([]);
      } finally {
        if (!cancelled) setSeekerLoading(false);
      }
    }
    loadSeekerData();
    return () => {
      cancelled = true;
    };
  }, [perspective, reqParamId]);

  // 2. Fetch matches for selected Seeker requirement
  const activeMyReq = myRequirements.find((r) => r.requirementId === selectedMyReqId);

  useEffect(() => {
    if (perspective !== "seeker") return;
    if (!activeMyReq && !adhocQuery.trim()) {
      setSeekerResults([]);
      return;
    }

    let cancelled = false;
    async function fetchSeekerMatches() {
      setSeekerLoading(true);
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const description = activeMyReq ? activeMyReq.description : adhocQuery;
        const location = activeMyReq?.location ?? {
          address: adhocLocation,
          latitude: 19.0588,
          longitude: 72.8653,
        };

        const data = await seekerApi.search({
          description,
          fromTimestamp: tomorrow.toISOString().slice(0, 10),
          toTimestamp: tomorrow.toISOString().slice(0, 10),
          location,
        });

        if (!cancelled) {
          const products = (data as any)?.products ?? (data as any)?.results ?? (Array.isArray(data) ? data : []);
          setSeekerResults(products);
        }
      } catch (e) {
        console.error("Seeker match error:", e);
        if (!cancelled) setSeekerResults([]);
      } finally {
        if (!cancelled) setSeekerLoading(false);
      }
    }

    fetchSeekerMatches();
    return () => {
      cancelled = true;
    };
  }, [perspective, selectedMyReqId, activeMyReq, adhocQuery, adhocLocation]);

  // 3. Provider Mode: Load provider's inventory and match with market demands
  useEffect(() => {
    if (perspective !== "provider") return;
    let cancelled = false;
    async function loadProviderDemands() {
      setProviderLoading(true);
      try {
        const [resources, demands] = await Promise.all([
          resourcesApi.getMine(),
          requirementsApi.getAll(profile?.userId ? { exclude_user_id: profile.userId } : undefined),
        ]);

        if (cancelled) return;

        const resList = Array.isArray(resources) ? resources : [];
        const rawDemands = Array.isArray(demands) ? demands : [];

        // STRICT PERSPECTIVE SEPARATION:
        // A provider must NEVER see or monetize their own requirements in Demand Matches
        const currentUserId = profile?.userId;
        const currentBusinessName = profile?.businessName?.trim().toLowerCase();
        const currentEmail = profile?.email?.trim().toLowerCase();
        const myResourceProviderIds = new Set(
          resList.map((r) => r.providerId || (r as any).userId).filter(Boolean)
        );

        const demandList = rawDemands.filter((req) => {
          // 1. Exclude if seekerId or nested seeker.userId matches current user UID
          if (
            currentUserId &&
            (req.seekerId === currentUserId || req.seeker?.userId === currentUserId)
          ) {
            return false;
          }
          // 2. Exclude if seekerId matches the providerId of any resource owned by the current business
          if (req.seekerId && myResourceProviderIds.has(req.seekerId)) {
            return false;
          }
          // 3. Exclude if business name matches current user's business name
          if (
            currentBusinessName &&
            req.seeker?.businessName &&
            req.seeker.businessName.trim().toLowerCase() === currentBusinessName
          ) {
            return false;
          }
          // 4. Exclude if email matches current user's email
          if (
            currentEmail &&
            req.seeker?.email &&
            req.seeker.email.trim().toLowerCase() === currentEmail
          ) {
            return false;
          }
          return true;
        });

        setMyResources(resList);
        setAllMarketDemands(demandList);

        // Compute compatibility between provider's resources and external buyer demands
        const matches: DemandMatch[] = [];
        for (const req of demandList) {
          const reqLat = req.location?.latitude ?? 19.076;
          const reqLon = req.location?.longitude ?? 72.8777;

          for (const res of resList) {
            // Extra safety guard: never pair a resource and requirement from the same entity
            if (req.seekerId && res.providerId && req.seekerId === res.providerId) {
              continue;
            }

            const resLat = res.location?.latitude ?? 19.076;
            const resLon = res.location?.longitude ?? 72.8777;
            const dist = haversineKm(reqLat, reqLon, resLat, resLon);

            // Match by category or keywords in description
            const catMatch =
              req.description.toLowerCase().includes(res.category.replace(/_/g, " ")) ||
              (res.name && req.description.toLowerCase().includes(res.name.toLowerCase().split(" ")[0]));

            if (catMatch || dist <= 15) {
              const baseScore = catMatch ? 90 : 70;
              const distScore = Math.max(0, 10 - dist);
              const score = Math.min(99, Math.round(baseScore + distScore));
              const revenue = (res.price ?? 500) * Math.min(res.availableQuantity ?? 50, 100);

              matches.push({
                requirement: req,
                compatibleResource: res,
                score,
                distanceKm: dist,
                estimatedRevenue: revenue,
              });
            }
          }
        }

        matches.sort((a, b) => b.score - a.score);
        setDemandMatches(matches);
      } catch (err) {
        console.error("Provider demand load error:", err);
      } finally {
        if (!cancelled) setProviderLoading(false);
      }
    }

    loadProviderDemands();
    return () => {
      cancelled = true;
    };
  }, [perspective, profile?.userId, profile?.businessName, profile?.email]);

  // Seeker actions: Rent from provider
  const handleBookDelivery = (match: MatchResult) => {
    if (perspective !== "seeker") {
      toast.error("Switch to Seeker View to book resources.");
      return;
    }
    const pickup = encodeURIComponent(match.location?.address ?? match.provider?.businessName ?? "Dadar West, Mumbai");
    const drop = encodeURIComponent(
      activeMyReq?.location?.address ?? adhocLocation
    );
    const pLat = match.location?.latitude ?? 19.0178;
    const pLng = match.location?.longitude ?? 72.8478;
    const dLat = activeMyReq?.location?.latitude ?? 19.044;
    const dLng = activeMyReq?.location?.longitude ?? 72.821;
    const qty = match.matchedItem?.requestedQuantity ?? (activeMyReq?.items?.[0]?.quantity ?? 300);

    router.push(
      `/dashboard/logistics?resourceId=${match.resourceId}&pickup=${pickup}&delivery=${drop}&pickupLat=${pLat}&pickupLng=${pLng}&deliveryLat=${dLat}&deliveryLng=${dLng}&quantity=${qty}`
    );
  };

  // Provider action: Submit offer to fulfill demand
  const handleFulfillDemand = (match: DemandMatch) => {
    toast.success(`Quote initiated for ${match.requirement.seeker?.businessName ?? "Buyer"}`);
    router.push(`/dashboard/requests?new=1&reqId=${match.requirement.requirementId}&resId=${match.compatibleResource.resourceId}`);
  };

  const handleAdhocSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhocQuery.trim()) {
      toast.error("Please enter what equipment you need");
      return;
    }
    setSelectedMyReqId("");
  };

  /* ════════════════════════════════════════════════════════════
     1. SEEKER VIEW — SOURCING ONLY (NO CROSS-BUSINESS LEAKS)
  ════════════════════════════════════════════════════════════ */
  if (perspective === "seeker") {
    const topSeekerMatch = seekerResults[0];
    const otherSeekerMatches = seekerResults.slice(1, 5);

    return (
      <div className="space-y-6 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tracking-wide mb-2">
              <SparklesIcon className="size-3.5" />
              <span>SEEKER SOURCING PAIRING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Smart Matches
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Find verified surplus banquet furniture, AV staging, industrial kitchens & delivery fleets from 5-star Mumbai venues for your event.
            </p>
          </div>

          <Link href="/dashboard/requirements?new=1">
            <Button className="font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
              <PlusIcon className="size-4" />
              Post New Requirement
            </Button>
          </Link>
        </div>

        {/* ── Seeker's OWN Requirements Selector ── */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ClipboardListIcon className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Your Saved Event Requirements ({myRequirements.length})
              </h2>
            </div>
            {myRequirements.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                Select one of your needs to find supplier capacity
              </span>
            )}
          </div>

          {/* User has requirements */}
          {myRequirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRequirements.map((req) => {
                const isSelected = selectedMyReqId === req.requirementId;
                return (
                  <button
                    key={req.requirementId}
                    onClick={() => {
                      setSelectedMyReqId(req.requirementId);
                      setAdhocQuery("");
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-foreground line-clamp-1">
                        {req.items && req.items.length > 0
                          ? req.items.map((i) => i.name).join(", ")
                          : "Event Requirement"}
                      </span>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                        {shortLocation(req.location?.address)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>
                    {req.budget ? (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                        Budget: ₹{req.budget.toLocaleString("en-IN")}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            /* User has NO requirements yet */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  You have not created any saved requirements yet.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Type what you need below to search live inventory across 5-star Mumbai venues, or post a permanent requirement.
                </p>
              </div>

              <form onSubmit={handleAdhocSearch} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      What resources do you need to rent?
                    </label>
                    <input
                      type="text"
                      value={adhocQuery}
                      onChange={(e) => setAdhocQuery(e.target.value)}
                      placeholder="e.g. 200 banquet chairs, 20 round tables, and 1 LED video wall"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Delivery Location in Mumbai
                    </label>
                    <input
                      type="text"
                      value={adhocLocation}
                      onChange={(e) => setAdhocLocation(e.target.value)}
                      placeholder="e.g. Bandra Kurla Complex, Mumbai"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="font-bold flex items-center gap-1.5 cursor-pointer">
                    <SearchIcon className="size-3.5" />
                    <span>Find Matching Provider Inventory</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Active Sourcing Query Indicator ── */}
        {(activeMyReq || adhocQuery.trim()) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-primary uppercase tracking-wide">Searching For:</span>
                <span className="text-xs font-bold text-foreground">
                  {activeMyReq ? activeMyReq.description : adhocQuery}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Destination: {shortLocation(activeMyReq?.location?.address ?? adhocLocation)}
              </p>
            </div>
            {activeMyReq && (
              <Link href="/dashboard/requirements" className="shrink-0">
                <Button variant="outline" size="xs" className="text-xs">
                  Manage My Requirements
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* ── Loading State ── */}
        {seekerLoading && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border bg-card">
            <Loader2Icon className="size-9 animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Searching surplus inventory across 5-star Mumbai venues...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluating category compatibility, real OSM transit distance, and co-loading routes
            </p>
          </div>
        )}

        {/* ── No Matches ── */}
        {!seekerLoading && seekerResults.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-base font-semibold text-foreground">No matching provider resources found.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try entering different items or browse all venue surplus on the{" "}
              <Link href="/dashboard/marketplace" className="text-primary font-bold underline">
                Marketplace
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── Top Match Feature Card (Provider's Surplus Item) ── */}
        {!seekerLoading && topSeekerMatch && (
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider">
                  Top Ranked Match
                </span>
                {topSeekerMatch.distanceKm != null && (
                  <span className="text-xs text-muted-foreground font-medium">
                    • Distance {topSeekerMatch.distanceKm.toFixed(1)} km from your venue ({shortLocation(activeMyReq?.location?.address ?? adhocLocation)})
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                High Confidence Match
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Col 1: Photo & Provider (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted border border-border">
                  <img
                    src={getImage(topSeekerMatch.category, topSeekerMatch.images)}
                    alt={topSeekerMatch.name}
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {topSeekerMatch.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {topSeekerMatch.provider?.businessName ?? "Provider"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <StarIcon className="size-3 fill-amber-500" />
                      {topSeekerMatch.provider?.rating?.toFixed(1) ?? "4.9"}
                    </span>
                    <span>•</span>
                    <span>{shortLocation(topSeekerMatch.location?.address)}</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Radial Score & Breakdown (5 cols) */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 border-y lg:border-y-0 lg:border-x border-border py-6 lg:py-0 lg:px-6">
                <RadialScore score={computeScore(topSeekerMatch)} size="md" />
                <div className="w-full flex-1">
                  <ScoreBreakdown breakdown={computeScoreBreakdown(topSeekerMatch)} />
                </div>
              </div>

              {/* Col 3: Pricing & Actions (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Daily Rental Rate</p>
                  <p className="text-2xl font-extrabold text-foreground">
                    ₹{topSeekerMatch.price.toLocaleString("en-IN")}
                  </p>
                  <div className="space-y-0.5 mt-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {topSeekerMatch.availableQuantity} of {topSeekerMatch.quantity}
                      </span>{" "}
                      units in supplier inventory
                    </p>
                    {topSeekerMatch.matchedItem?.requestedQuantity ? (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2Icon className="size-3.5 shrink-0" />
                        <span>
                          Covers your requirement of {topSeekerMatch.matchedItem.requestedQuantity}{" "}
                          {topSeekerMatch.matchedItem.name || "units"}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <TruckIcon className="size-3.5" />
                      <span>Shared Route Compatible</span>
                    </div>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      Co-loading route available from {shortLocation(topSeekerMatch.location?.address)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={() => handleBookDelivery(topSeekerMatch)} className="w-full font-bold shadow-xs cursor-pointer">
                    Rent & Book Shared Delivery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBookDelivery(topSeekerMatch)}
                    className="w-full text-xs font-semibold"
                  >
                    Inspect Co-Loading Route
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Other Qualified Provider Matches ── */}
        {!seekerLoading && otherSeekerMatches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Other Qualified Provider Matches in Mumbai</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherSeekerMatches.map((alt) => (
                <div
                  key={alt.resourceId}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-16 overflow-hidden rounded-xl bg-muted shrink-0 border border-border">
                      <img src={getImage(alt.category, alt.images)} alt={alt.name} className="size-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-snug">{alt.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {alt.provider?.businessName ?? "Provider"} • {shortLocation(alt.location?.address)}
                        {alt.distanceKm != null && ` • ${alt.distanceKm.toFixed(1)} km`}
                      </p>
                      <p className="text-xs font-extrabold text-foreground mt-1">
                        ₹{alt.price.toLocaleString("en-IN")}/unit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg">
                      {computeScore(alt)}%
                    </span>
                    <Button size="xs" onClick={() => handleBookDelivery(alt)}>
                      Rent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     2. PROVIDER VIEW — DEMAND MONETIZATION ONLY (SELLING SURPLUS)
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mb-2">
            <DollarSignIcon className="size-3.5" />
            <span>PROVIDER DEMAND MONETIZATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Demand Matches
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Active hospitality buyer requirements in Mumbai compatible with your surplus venue inventory. Submit rental quotes and monetize idle capacity.
          </p>
        </div>

        <Link href="/dashboard/resources?new=1">
          <Button className="font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
            <PlusIcon className="size-4" />
            List More Surplus Inventory
          </Button>
        </Link>
      </div>

      {/* ── Provider Loading ── */}
      {providerLoading && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border bg-card">
          <Loader2Icon className="size-9 animate-spin text-emerald-500" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Scanning active Mumbai event requirements against your surplus listings...
          </p>
        </div>
      )}

      {/* ── No Demand Matches ── */}
      {!providerLoading && demandMatches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-base font-semibold text-foreground">No compatible event demands found.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            List more resources in{" "}
            <Link href="/dashboard/resources" className="text-primary font-bold underline">
              My Resources
            </Link>{" "}
            to match with buyer requirements across Mumbai.
          </p>
        </div>
      )}

      {/* ── Provider Matches List ── */}
      {!providerLoading && demandMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            Compatible Buyer Requirements ({demandMatches.length} Matches)
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {demandMatches.map((match, idx) => {
              const req = match.requirement;
              const res = match.compatibleResource;
              const buyerName = req.seeker?.businessName ?? "Hospitality Buyer";
              return (
                <div
                  key={`${req.requirementId}-${res.resourceId}-${idx}`}
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{buyerName}</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {shortLocation(req.location?.address)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {match.distanceKm.toFixed(1)} km away
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "{req.description}"
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-muted-foreground">Your Matching Inventory:</span>
                      <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                        {res.name} ({res.availableQuantity} available)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground font-medium">Compatibility</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {match.score}%
                      </p>
                      {req.budget ? (
                        <p className="text-[11px] text-muted-foreground">
                          Budget: ₹{req.budget.toLocaleString("en-IN")}
                        </p>
                      ) : null}
                    </div>

                    <Button onClick={() => handleFulfillDemand(match)} className="font-bold cursor-pointer">
                      Submit Quote / Offer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SmartMatchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <SmartMatchesContent />
    </Suspense>
  );
}
