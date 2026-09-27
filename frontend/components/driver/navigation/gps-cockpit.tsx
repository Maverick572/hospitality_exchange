"use client";

import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  GaugeIcon,
  ListOrderedIcon,
  MapPinIcon,
  Minimize2Icon,
  Navigation2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RouteIcon,
  SparklesIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useDriverNavigation } from "@/contexts/driver-navigation-context";
import { deliveriesApi } from "@/lib/api";
import { formatDistance, formatDuration } from "@/lib/services/osrm-routing";
import type { DeliveryStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { OsmMap } from "./osm-map";
import { TurnIcon } from "./turn-icon";

const NEXT_DELIVERY_STEP: Record<
  DeliveryStatus,
  { nextStatus: DeliveryStatus; label: string } | null
> = {
  pickup_pending: { nextStatus: "picked_up", label: "Mark Picked Up" },
  picked_up: { nextStatus: "in_transit", label: "Start Transit" },
  in_transit: { nextStatus: "delivered", label: "Mark Delivered" },
  delivered: null,
};

export function GpsNavigationCockpit() {
  const {
    activeTarget,
    isNavigating,
    trackingMode,
    currentPosition,
    routeData,
    currentStepIndex,
    remainingDistanceMeters,
    remainingDurationSeconds,
    simulationSpeed,
    isSimulationPaused,
    stopNavigation,
    toggleMinimize,
    setTrackingMode,
    setSimulationSpeed,
    setSimulationPaused,
    setCurrentStepIndex,
  } = useDriverNavigation();

  const [stepsDrawerOpen, setStepsDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(
    activeTarget?.currentStatus ?? "in_transit"
  );

  if (!isNavigating || !activeTarget) {
    return null;
  }

  const steps = routeData?.steps ?? [];
  const currentStep = steps[currentStepIndex] ?? {
    instruction: "Proceed toward destination",
    maneuver: "turn",
    modifier: "straight",
    distanceMeters: remainingDistanceMeters,
    durationSeconds: remainingDurationSeconds,
    streetName: "Main Route",
  };

  const nextStep = steps[currentStepIndex + 1];

  // Calculate ETA time
  const etaDate = new Date(Date.now() + Math.max(0, remainingDurationSeconds) * 1000);
  const etaFormatted = etaDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const nextAction = NEXT_DELIVERY_STEP[deliveryStatus];

  async function handleAdvanceStatus() {
    if (!nextAction || activeTarget?.type !== "booking") return;
    setUpdatingStatus(true);
    try {
      await deliveriesApi.updateStatus(activeTarget.id, nextAction.nextStatus);
      setDeliveryStatus(nextAction.nextStatus);
      toast.success(`Delivery status updated to: ${nextAction.nextStatus.replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update delivery status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* 1. TOP GUIDANCE HUD (Turn-by-turn Banner) */}
      <header className="relative z-10 flex flex-col justify-between border-b border-zinc-800 bg-zinc-950 p-4 text-white shadow-lg md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {/* Large Turn Maneuver Icon */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md ring-4 ring-emerald-500/20">
            <TurnIcon
              maneuver={currentStep.maneuver}
              modifier={currentStep.modifier}
              className="size-8"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-emerald-400">
                {formatDistance(currentStep.distanceMeters || remainingDistanceMeters)}
              </span>
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                {currentStep.maneuver}
              </span>
            </div>
            <p className="truncate text-base font-semibold leading-tight text-white md:text-lg">
              {currentStep.instruction}
            </p>
            {nextStep && (
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                Then in {formatDistance(nextStep.distanceMeters)}: {nextStep.instruction}
              </p>
            )}
          </div>
        </div>

        {/* Top Right Controls & Mode Badges */}
        <div className="mt-3 flex items-center justify-end gap-2 md:mt-0">
          <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs">
            <span
              className={`size-2 rounded-full ${
                trackingMode === "simulation"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-semibold text-zinc-200">
              {trackingMode === "simulation" ? "Demo Simulator" : "Live GPS"}
            </span>
          </div>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggleMinimize}
            className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
            title="Minimize to Floating Bar"
          >
            <Minimize2Icon className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={stopNavigation}
            className="text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
            title="Exit Navigation"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </header>

      {/* 2. MAP CANVAS SURFACE */}
      <div className="relative flex-1">
        <OsmMap />

        {/* Collapsible Step Direction Sheet Button */}
        <button
          onClick={() => setStepsDrawerOpen((o) => !o)}
          className="absolute left-4 top-4 z-[500] flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md hover:bg-background"
        >
          <ListOrderedIcon className="size-3.5 text-primary" />
          <span>{stepsDrawerOpen ? "Hide Directions" : `All Steps (${steps.length})`}</span>
          {stepsDrawerOpen ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
        </button>

        {/* Turn Directions Expandable Drawer */}
        {stepsDrawerOpen && (
          <aside className="absolute left-4 top-14 z-[500] max-h-[280px] w-80 overflow-y-auto rounded-xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Turn-by-turn route steps
            </h4>
            <div className="divide-y divide-border text-sm">
              {steps.map((st, i) => (
                <div
                  key={st.id}
                  onClick={() => setCurrentStepIndex(i)}
                  className={`flex cursor-pointer items-start gap-2.5 py-2 transition-colors hover:bg-muted/50 ${
                    i === currentStepIndex ? "rounded-md bg-primary/10 px-1 font-semibold text-primary" : ""
                  }`}
                >
                  <TurnIcon maneuver={st.maneuver} modifier={st.modifier} className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs leading-tight">{st.instruction}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistance(st.distanceMeters)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM COCKPIT ACTION DECK */}
      <footer className="border-t border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Trip Summary Stats */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-border bg-muted/60 p-2.5 text-center">
              <span className="block text-xs text-muted-foreground">Remaining</span>
              <span className="text-xl font-bold tracking-tight text-foreground">
                {formatDistance(remainingDistanceMeters)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <ClockIcon className="size-4 text-primary" />
                <span>{formatDuration(remainingDurationSeconds)}</span>
                <span className="text-xs font-normal text-muted-foreground">&bull; ETA {etaFormatted}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <GaugeIcon className="size-3.5" />
                <span>Current speed: {currentPosition?.speed ?? 0} km/h</span>
              </div>
            </div>
          </div>

          {/* Delivery Advance Status Action */}
          <div className="flex flex-col justify-center border-t border-border pt-3 md:border-l md:border-t-0 md:px-4 md:pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3 text-primary" />
                {activeTarget.title}
              </span>
              <span className="font-semibold uppercase text-foreground">{deliveryStatus.replace("_", " ")}</span>
            </div>
            {nextAction && (
              <Button
                size="sm"
                onClick={handleAdvanceStatus}
                disabled={updatingStatus}
                className="mt-2 w-full font-semibold shadow-xs"
              >
                <TruckIcon data-icon="inline-start" />
                {nextAction.label}
              </Button>
            )}
          </div>

          {/* Simulation & Testing Controls */}
          <div className="flex flex-col justify-center rounded-xl border border-border/80 bg-muted/40 p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <SparklesIcon className="size-3.5 text-amber-500" />
                Demo Simulator
              </span>
              <button
                onClick={() =>
                  setTrackingMode(trackingMode === "live" ? "simulation" : "live")
                }
                className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Switch to {trackingMode === "live" ? "Simulation" : "Live GPS"}
              </button>
            </div>

            {trackingMode === "simulation" ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSimulationPaused(!isSimulationPaused)}
                  className="h-8 gap-1 px-3 text-xs"
                >
                  {isSimulationPaused ? (
                    <>
                      <PlayIcon className="size-3.5 fill-current" /> Resume
                    </>
                  ) : (
                    <>
                      <PauseIcon className="size-3.5 fill-current" /> Pause
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
                  {([1, 2, 5] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimulationSpeed(spd)}
                      className={`rounded px-2 py-1 font-semibold transition-all ${
                        simulationSpeed === spd
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Watching real device GPS & compass updates.
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
