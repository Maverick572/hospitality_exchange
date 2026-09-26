"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  LockIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { RadialScore } from "@/components/matching/radial-score";
import { ScoreBreakdown } from "@/components/matching/score-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";

const SCENARIOS = [
  {
    id: "chairs",
    title: "Gala Wedding Seating",
    category: "Banquet Chairs",
    seeker: "Grand Meridian Hotel",
    need: "250 Cushioned Banquet Chairs for Gala Wedding Dinner",
    topMatch: {
      providerName: "Taj Horizon Hotel",
      resourceName: "300 Cushioned Banquet Chairs (Gold Frame)",
      quantity: 300,
      priceOffered: 7200,
      distance: "3.4 km",
      location: "Bandra West",
      overallScore: 94,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
      sharedTransportAvailable: true,
      logisticsSavings: 6500,
    },
    alternatives: [
      {
        id: "alt-1",
        providerName: "BlueBay Resort",
        resourceName: "250 Banquet Chairs (Chrome Finish)",
        price: 6800,
        score: 89,
        location: "Juhu",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "alt-2",
        providerName: "Royal Palm Events",
        resourceName: "300 Folding Banquet Chairs",
        price: 7500,
        score: 83,
        location: "Goregaon East",
        image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    id: "av",
    title: "Tech Summit AV Rigging",
    category: "AV Equipment",
    seeker: "Bandra Convention Center",
    need: "4K LED Video Wall & Line-Array Audio Rigging",
    topMatch: {
      providerName: "Elite Event Solutions",
      resourceName: "Full 4K LED Video Wall & Sound Rigging",
      quantity: 1,
      priceOffered: 32000,
      distance: "2.8 km",
      location: "BKC, Mumbai",
      overallScore: 96,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      sharedTransportAvailable: true,
      logisticsSavings: 4500,
    },
    alternatives: [
      {
        id: "alt-3",
        providerName: "StageCraft Pro",
        resourceName: "High-Lumen Projector & Line Array",
        price: 28000,
        score: 91,
        location: "Lower Parel",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];

export default function SmartMatchesPage() {
  const router = useRouter();
  const { perspective, setPerspective } = usePerspective();
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];
  const { topMatch } = scenario;

  const handleSendRequest = () => {
    if (perspective === "provider") {
      toast.error("Switch to Seeker View to book resources or dispatch requests.");
      return;
    }
    router.push("/dashboard/logistics");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tracking-wide mb-3">
          <SparklesIcon className="size-3.5" />
          <span>ALGORITHMIC PAIRING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Smart Matches
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Algorithmic multi-factor compatibility scoring pairing event requirements with surplus 5-star venue inventory.
        </p>
      </div>

      {/* ── Provider Mode Alert Banner ── */}
      {perspective === "provider" && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <ShieldAlertIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Provider View Active:</strong> Algorithmic pairing and demand booking is a Seeker operation. Switch to <strong>Seeker View</strong> to route and book delivery.
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

      {/* ── Scenario Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <span className="text-xs font-bold text-muted-foreground mr-2">Requirement Scenario:</span>
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelectedScenarioId(sc.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedScenarioId === sc.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {sc.title}
          </button>
        ))}
      </div>

      {/* ── Top Match Feature Card ── */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider">
              Top Ranked Match
            </span>
            <span className="text-xs text-muted-foreground font-medium">• Distance {topMatch.distance}</span>
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
                src={topMatch.image}
                alt={topMatch.resourceName}
                className="size-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground leading-snug">
                {topMatch.resourceName}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{topMatch.providerName}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <StarIcon className="size-3 fill-amber-500" />
                  {topMatch.rating}
                </span>
                <span>•</span>
                <span>{topMatch.location}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Radial Score & Breakdown (5 cols) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 border-y lg:border-y-0 lg:border-x border-border py-6 lg:py-0 lg:px-6">
            <RadialScore score={topMatch.overallScore} size="md" />
            <div className="w-full flex-1">
              <ScoreBreakdown />
            </div>
          </div>

          {/* Col 3: Pricing & Actions (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Estimated Pricing</p>
              <p className="text-2xl font-extrabold text-foreground">
                ₹{topMatch.priceOffered.toLocaleString("en-IN")}
              </p>

              {topMatch.sharedTransportAvailable && (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <TruckIcon className="size-3.5" />
                    <span>Shared Route Available</span>
                  </div>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    Saves ₹{topMatch.logisticsSavings.toLocaleString("en-IN")} in transit
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {perspective === "provider" ? (
                <button
                  type="button"
                  onClick={() => toast.error("Switch to Seeker View to route and book delivery.")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground shadow-2xs cursor-not-allowed hover:bg-muted"
                  title="Switch to Seeker View to book resources"
                >
                  <LockIcon className="size-3.5 text-muted-foreground" />
                  <span>Book Delivery (Seeker Only)</span>
                </button>
              ) : (
                <Button onClick={handleSendRequest} className="w-full font-bold shadow-xs cursor-pointer">
                  Route & Book Delivery
                </Button>
              )}
              <Link href="/dashboard/logistics" className="block">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Inspect Co-Loading Route
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alternative Matches ── */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4">Alternative Qualified Matches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenario.alternatives.map((alt) => (
            <div
              key={alt.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="size-16 overflow-hidden rounded-xl bg-muted shrink-0 border border-border">
                  <img src={alt.image} alt={alt.resourceName} className="size-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-snug">{alt.resourceName}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {alt.providerName} • {alt.location}
                  </p>
                  <p className="text-xs font-extrabold text-foreground mt-1">
                    ₹{alt.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg">
                  {alt.score}%
                </span>
                <Button size="xs" onClick={handleSendRequest}>
                  Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
