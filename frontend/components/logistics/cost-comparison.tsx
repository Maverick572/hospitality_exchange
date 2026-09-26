"use client";

import { CheckCircle2Icon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type CostComparisonProps = {
  onConfirm?: () => void;
};

export function CostComparison({ onConfirm }: CostComparisonProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* 2-Column Comparison */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-base font-bold text-foreground">Logistics Cost Comparison</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dedicated Transport Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-muted/40 p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dedicated Transport</p>
                <p className="mt-1 text-2xl font-bold text-muted-foreground line-through decoration-rose-500/70">
                  ₹8,000
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <TruckIcon className="size-4.5" />
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-400" />
                Separate vehicle charter required
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-400" />
                Full trip cost borne entirely by you
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-400" />
                Higher urban carbon footprint & congestion
              </li>
            </ul>
          </div>

          {/* Shared Transport Card (Recommended) */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-emerald-500 bg-emerald-500/5 p-5 shadow-xs">
            <div className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
              RECOMMENDED
            </div>

            <div className="flex items-start justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Shared Transport
                </p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  ₹1,500
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TruckIcon className="size-4.5" />
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-xs text-foreground font-medium">
              <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                Existing route: Bandra West → BKC Hub
              </li>
              <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                Co-loaded on Marriott Sprinter Van
              </li>
              <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                Pay only marginal capacity cost (-81% discount)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Itemized Cost Breakdown Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground border-b border-border pb-3">Cost Breakdown</h4>
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Resource Rental (300 Chairs)</span>
              <span className="font-semibold text-foreground">₹7,200</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shared Logistics (Co-loaded)</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹1,500</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform & Escrow Protection</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline text-sm font-bold text-foreground">
              <span>Total Payable</span>
              <span className="text-lg text-primary font-extrabold">₹8,700</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={onConfirm}
            className="w-full font-bold shadow-xs py-2.5"
            size="default"
          >
            Confirm Logistics & Dispatch
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Funds held securely in escrow until delivery is verified.
          </p>
        </div>
      </div>
    </div>
  );
}
