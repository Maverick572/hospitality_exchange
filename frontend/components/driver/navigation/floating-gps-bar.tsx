"use client";

import React from "react";
import { Maximize2Icon, NavigationIcon, XIcon } from "lucide-react";

import { useDriverNavigation } from "@/contexts/driver-navigation-context";
import { formatDistance, formatDuration } from "@/lib/services/osrm-routing";
import { Button } from "@/components/ui/button";
import { TurnIcon } from "./turn-icon";

export function FloatingGpsBar() {
  const {
    isNavigating,
    isMinimized,
    activeTarget,
    routeData,
    currentStepIndex,
    remainingDistanceMeters,
    remainingDurationSeconds,
    toggleMinimize,
    stopNavigation,
  } = useDriverNavigation();

  if (!isNavigating || !isMinimized || !activeTarget) {
    return null;
  }

  const steps = routeData?.steps ?? [];
  const currentStep = steps[currentStepIndex] ?? {
    instruction: "Proceed along route",
    maneuver: "turn",
    modifier: "straight",
    distanceMeters: remainingDistanceMeters,
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] flex w-[92vw] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      {/* Maneuver Icon */}
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30">
        <TurnIcon
          maneuver={currentStep.maneuver}
          modifier={currentStep.modifier}
          className="size-6"
        />
      </div>

      {/* Maneuver info & ETA */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-emerald-400">
            {formatDistance(currentStep.distanceMeters || remainingDistanceMeters)}
          </span>
          <span className="truncate text-xs font-semibold text-zinc-100">
            {currentStep.instruction}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-zinc-400">
          {formatDuration(remainingDurationSeconds)} remaining &bull; {formatDistance(remainingDistanceMeters)} &bull; {activeTarget.title}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          onClick={toggleMinimize}
          className="h-8 gap-1 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
        >
          <Maximize2Icon className="size-3.5" />
          <span>Resume GPS</span>
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={stopNavigation}
          className="size-8 rounded-xl text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
          title="Exit Navigation"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
