"use client";

import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";

export function RouteVisualizer() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-xs">
      <h3 className="text-center text-base md:text-lg font-bold tracking-tight text-foreground mb-8">
        Optimized Delivery Route
      </h3>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 md:flex-row md:gap-0 py-4">
        {/* Animated Connecting Line (Desktop) */}
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-1/2 hidden -translate-y-1/2 md:block overflow-hidden opacity-40">
          <svg width="100%" height="6" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="0"
              y1="3"
              x2="100%"
              y2="3"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="8 8"
              className="animate-pulse text-muted-foreground"
            />
          </svg>
        </div>

        {/* Node 1: Origin */}
        <div className="z-10 flex w-56 flex-col items-center text-center group">
          <div className="relative mb-3 size-24 overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-xs transition-transform group-hover:scale-105">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
              alt="Taj Horizon Hotel"
              className="size-full object-cover"
            />
          </div>
          <h4 className="text-sm font-bold text-foreground">Taj Horizon Hotel</h4>
          <p className="mt-0.5 text-xs text-muted-foreground font-medium">Bandra West (Origin)</p>
          <div className="mt-2.5 rounded-lg border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground">
            Pickup: 3:30 PM
          </div>
        </div>

        {/* Mobile Arrow */}
        <div className="text-muted-foreground md:hidden">
          <ArrowRightIcon className="size-6 rotate-90" />
        </div>

        {/* Node 2: Co-Loading Vehicle */}
        <div className="z-10 flex w-60 flex-col items-center text-center group">
          <div className="relative mb-3">
            <div className="size-24 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-muted shadow-sm transition-transform group-hover:scale-105">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80"
                alt="Marriott Delivery Van"
                className="size-full object-cover"
              />
            </div>
            <span className="absolute -top-2.5 -right-2.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Co-Loading
            </span>
          </div>
          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Marriott Delivery Van</h4>
          <p className="mt-0.5 text-xs text-muted-foreground font-medium">Shared Route #402</p>
          <div className="mt-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            42% spare capacity
          </div>
        </div>

        {/* Mobile Arrow */}
        <div className="text-muted-foreground md:hidden">
          <ArrowRightIcon className="size-6 rotate-90" />
        </div>

        {/* Node 3: Destination */}
        <div className="z-10 flex w-56 flex-col items-center text-center group">
          <div className="relative mb-3 size-24 overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-xs transition-transform group-hover:scale-105">
            <img
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80"
              alt="Convention Center"
              className="size-full object-cover"
            />
          </div>
          <h4 className="text-sm font-bold text-foreground">Convention Center</h4>
          <p className="mt-0.5 text-xs text-muted-foreground font-medium">Bandra East (Dropoff)</p>
          <div className="mt-2.5 rounded-lg border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground">
            Delivery: 4:00 PM
          </div>
        </div>
      </div>
    </div>
  );
}
