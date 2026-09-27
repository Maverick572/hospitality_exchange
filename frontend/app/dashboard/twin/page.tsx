"use client";

/**
 * Digital Twin Simulation Page
 *
 * Spec: digital-twin-frontend-spec.md
 * Route: /dashboard/twin
 *
 * Global constraints enforced:
 *   1. Never calls a write endpoint while mode === "simulated"
 *   2. Never persists simulated results as real state
 *   3. Modes are always visually distinct (banner + background tint)
 */

import { useCallback, useState } from "react";

import { Page, PageHeader } from "@/components/page-header";
import { ModeBanner } from "@/components/twin/mode-banner";
import { ModeToggle } from "@/components/twin/mode-toggle";
import { ScenarioControls } from "@/components/twin/scenario-controls";
import { ImpactResultList } from "@/components/twin/impact-results";
import { NarrativePanel } from "@/components/twin/narrative-panel";
import { WeatherCard } from "@/components/twin/weather-card";
import { useTwinSimulation } from "@/hooks/use-twin-simulation";
import type { ScenarioState, WeatherMode } from "@/lib/twin-types";
import { DEFAULT_SCENARIO } from "@/lib/twin-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivityIcon,
  GaugeIcon,
  ZapIcon,
  TrendingDownIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Condition summary bar                                              */
/* ------------------------------------------------------------------ */

function ConditionSummary({
  label,
  mode,
}: {
  label: string | undefined;
  mode: WeatherMode;
}) {
  if (!label) return null;

  const config: Record<string, { bg: string; text: string; emoji: string; display: string }> = {
    storm:        { bg: "bg-red-500/10",    text: "text-red-400",    emoji: "⛈️",  display: "Storm" },
    heavy_rain:   { bg: "bg-orange-500/10", text: "text-orange-400", emoji: "🌧️",  display: "Heavy Rain" },
    light_rain:   { bg: "bg-blue-500/10",   text: "text-blue-400",   emoji: "🌦️",  display: "Light Rain" },
    extreme_heat: { bg: "bg-red-500/10",    text: "text-red-400",    emoji: "🔥",  display: "Extreme Heat" },
    normal:       { bg: "bg-emerald-500/10",text: "text-emerald-400", emoji: "☀️", display: "Normal" },
  };

  const c = config[label] ?? config.normal;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3", c.bg)}>
      <span className="text-2xl">{c.emoji}</span>
      <div>
        <p className={cn("text-sm font-semibold", c.text)}>{c.display} Conditions</p>
        <p className="text-xs text-muted-foreground">
          {mode === "simulated" ? "Simulated scenario" : "Current observed conditions"}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick stat cards                                                   */
/* ------------------------------------------------------------------ */

function QuickStats({
  simResult,
  simStatus,
}: {
  simResult: ReturnType<typeof useTwinSimulation>["simResult"];
  simStatus: string;
}) {
  if (simStatus === "loading") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!simResult) return null;

  const resources = simResult.resourceImpact.results;
  const routes = simResult.logisticsImpact.routes;

  const avgScore = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + r.adjustedScore, 0) / resources.length)
    : 0;
  const avgDelta = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + r.delta, 0) / resources.length)
    : 0;
  const avgEta = routes.length > 0
    ? Math.round(routes.reduce((sum, r) => sum + r.adjustedEtaMinutes, 0) / routes.length)
    : 0;
  const avgCost = routes.length > 0
    ? (routes.reduce((sum, r) => sum + r.costMultiplier, 0) / routes.length).toFixed(2)
    : "1.00";

  const stats = [
    { label: "Avg Score", value: avgScore, icon: GaugeIcon, color: avgScore >= 70 ? "text-emerald-400" : avgScore >= 40 ? "text-amber-400" : "text-red-400" },
    { label: "Score Impact", value: `${avgDelta >= 0 ? "+" : ""}${avgDelta}`, icon: TrendingDownIcon, color: avgDelta === 0 ? "text-muted-foreground" : avgDelta > 0 ? "text-emerald-400" : "text-red-400" },
    { label: "Avg ETA", value: `${avgEta} min`, icon: ActivityIcon, color: "text-blue-400" },
    { label: "Cost Factor", value: `${avgCost}×`, icon: ZapIcon, color: Number(avgCost) > 1.2 ? "text-amber-400" : "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1 rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm"
        >
          <s.icon className={cn("size-4", s.color)} />
          <span className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</span>
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TwinPage() {
  /* ---- State ---- */
  const [mode, setMode] = useState<WeatherMode>("live");
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO);

  /* ---- Hook ---- */
  const {
    liveWeather,
    liveWeatherStatus,
    simResult,
    simStatus,
    narrativeStatus,
    refetch,
  } = useTwinSimulation(scenario, mode);

  /* ---- Handlers ---- */
  const handleModeChange = useCallback((newMode: WeatherMode) => {
    setMode(newMode);
    if (newMode === "live") {
      setScenario(DEFAULT_SCENARIO);
    }
  }, []);

  const handleReset = useCallback(() => {
    setMode("live");
    setScenario(DEFAULT_SCENARIO);
  }, []);

  /* ---- Derived ---- */
  const isSimulated = mode === "simulated";
  const activeLabel = isSimulated
    ? simResult?.conditionLabel
    : liveWeather?.conditionLabel;

  return (
    <Page
      className={cn(
        "pb-10 transition-all duration-500",
        // Subtle background tint so the entire panel looks different in simulated mode (spec § 6)
        isSimulated && "bg-gradient-to-b from-amber-500/[0.03] to-transparent rounded-3xl -mx-4 px-4 sm:mx-0 sm:px-0",
      )}
    >
      {/* Header */}
      <PageHeader title="Digital Twin Simulator" icon="🔬" />

      {/* Mode banner + toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ModeBanner mode={mode} />
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Condition summary */}
      <ConditionSummary label={activeLabel} mode={mode} />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column: controls + weather */}
        <div className="flex flex-col gap-5">
          <ScenarioControls
            mode={mode}
            scenario={scenario}
            onChange={setScenario}
            onReset={handleReset}
          />
          <WeatherCard
            weather={liveWeather}
            status={liveWeatherStatus}
          />

          {/* Simulated mode write-action guard */}
          {isSimulated && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-amber-400">
                ⚠️ Booking disabled — viewing a simulated scenario.
                <br />
                <span className="text-muted-foreground">
                  Switch to Live mode to perform real actions.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Right column: results */}
        <div className="flex flex-col gap-6">
          {/* Quick stats */}
          {isSimulated && (
            <QuickStats simResult={simResult} simStatus={simStatus} />
          )}

          {/* Impact cards */}
          {isSimulated ? (
            <ImpactResultList
              resources={simResult?.resourceImpact.results ?? []}
              routes={simResult?.logisticsImpact.routes ?? []}
              mode={mode}
              simStatus={simStatus}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16">
              <span className="text-4xl">🎛️</span>
              <p className="text-sm font-medium text-foreground/70">
                Switch to Simulated mode to explore weather scenarios
              </p>
              <p className="text-xs text-muted-foreground">
                Drag the sliders to see how weather affects resource availability and logistics
              </p>
            </div>
          )}

          {/* Narrative panel */}
          <NarrativePanel
            status={narrativeStatus}
            text={simResult?.narrative ?? null}
            onRetry={refetch}
          />
        </div>
      </div>
    </Page>
  );
}
