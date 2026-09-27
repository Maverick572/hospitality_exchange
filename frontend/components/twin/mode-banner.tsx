"use client";

import type { WeatherMode } from "@/lib/twin-types";
import { cn } from "@/lib/utils";

/**
 * Persistent mode banner — always visible at top of the twin page.
 * Spec § 2: "🟢 Live conditions" | "🟠 Simulated scenario — no real bookings affected"
 * Spec § 6: modes must be visually distinct at all times.
 */
export function ModeBanner({ mode }: { mode: WeatherMode }) {
  const isLive = mode === "live";

  return (
    <div
      id="twin-mode-banner"
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
        isLive
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
          : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
      )}
    >
      <span
        className={cn(
          "inline-block size-2.5 rounded-full",
          isLive
            ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]"
            : "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.4)] animate-pulse",
        )}
      />
      {isLive ? (
        <span>Live conditions</span>
      ) : (
        <span>Simulated scenario — <span className="opacity-80">no real bookings affected</span></span>
      )}
    </div>
  );
}
