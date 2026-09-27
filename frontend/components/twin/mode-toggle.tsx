"use client";

import { cn } from "@/lib/utils";
import type { WeatherMode } from "@/lib/twin-types";

/**
 * Accessible toggle switch between Live ⇄ Simulated modes.
 * Uses a real <button> with aria-pressed (spec § 7: keyboard-only interaction).
 */
export function ModeToggle({
  mode,
  onChange,
}: {
  mode: WeatherMode;
  onChange: (mode: WeatherMode) => void;
}) {
  const isSimulated = mode === "simulated";

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isSimulated ? "text-emerald-400" : "text-muted-foreground",
        )}
      >
        Live
      </span>

      <button
        id="twin-mode-toggle"
        type="button"
        role="switch"
        aria-checked={isSimulated}
        aria-label={`Switch to ${isSimulated ? "live" : "simulated"} mode`}
        onClick={() => onChange(isSimulated ? "live" : "simulated")}
        className={cn(
          "relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isSimulated
            ? "bg-amber-500/30 ring-1 ring-amber-500/40"
            : "bg-emerald-500/30 ring-1 ring-emerald-500/40",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-5 rounded-full shadow-md transition-all duration-300",
            isSimulated
              ? "translate-x-[27px] bg-amber-400"
              : "translate-x-1 bg-emerald-400",
          )}
        />
      </button>

      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isSimulated ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        Simulated
      </span>
    </div>
  );
}
