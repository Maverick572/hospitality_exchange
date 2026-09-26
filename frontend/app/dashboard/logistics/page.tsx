"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlertIcon, TrendingDownIcon, TruckIcon } from "lucide-react";
import { toast } from "sonner";

import { CostComparison } from "@/components/logistics/cost-comparison";
import { RouteVisualizer } from "@/components/logistics/route-visualizer";
import { Button } from "@/components/ui/button";
import { usePerspective } from "@/lib/perspective";

export default function LogisticsPage() {
  const router = useRouter();
  const { perspective, setPerspective } = usePerspective();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (perspective === "provider") {
      toast.error("Switch to Seeker View to confirm logistics dispatch.");
      return;
    }
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
      <CostComparison perspective={perspective} onConfirm={handleConfirm} />

      {confirmed && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground p-4 text-xs font-semibold text-background shadow-lg">
          ✓ Booking request with co-loaded route dispatched! Redirecting to negotiations...
        </div>
      )}
    </div>
  );
}
