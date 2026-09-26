"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDownIcon, TruckIcon } from "lucide-react";

import { CostComparison } from "@/components/logistics/cost-comparison";
import { RouteVisualizer } from "@/components/logistics/route-visualizer";

export default function LogisticsPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      router.push("/dashboard/requests");
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mb-3">
          <TruckIcon className="size-3.5" />
          <span>SMART LOGISTICS MATCH</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Logistics-Aware Matching
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          We found an existing vehicle route that can transport your resources without requiring a dedicated trip, cutting your logistics costs by up to 81%.
        </p>
      </div>

      {/* ── Route Visualization Card ── */}
      <RouteVisualizer />

      {/* ── Big Savings Banner ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <TrendingDownIcon className="size-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Co-Loading Cost Reduction
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              You Save ₹6,500
            </h2>
          </div>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-center shadow-xs">
          <span className="text-sm sm:text-base font-extrabold text-emerald-700">
            81% Cheaper Logistics
          </span>
        </div>
      </div>

      {/* ── Cost Comparison & Summary ── */}
      <CostComparison onConfirm={handleConfirm} />

      {confirmed && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground p-4 text-xs font-semibold text-background shadow-lg">
          ✓ Booking request with co-loaded route dispatched! Redirecting to negotiations...
        </div>
      )}
    </div>
  );
}
