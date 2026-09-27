"use client";

import { useCallback } from "react";
import {
  CloudRainIcon,
  ThermometerIcon,
  ClockIcon,
  MapPinIcon,
  RotateCcwIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ScenarioState, WeatherMode } from "@/lib/twin-types";
import { DEFAULT_SCENARIO } from "@/lib/twin-types";

/* ------------------------------------------------------------------ */
/*  Individual slider                                                  */
/* ------------------------------------------------------------------ */

function SliderRow({
  id,
  icon: Icon,
  label,
  unit,
  value,
  min,
  max,
  step,
  disabled,
  accentClass,
  onChange,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  accentClass: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="flex items-center gap-1.5 font-medium text-foreground/80">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </label>
        <span className={cn("tabular-nums font-semibold", disabled ? "text-muted-foreground" : accentClass)}>
          {value > 0 && value !== min ? "+" : ""}{value}{unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted transition-opacity",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125",
          "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md",
          disabled
            ? "opacity-40 cursor-not-allowed [&::-webkit-slider-thumb]:bg-muted-foreground [&::-moz-range-thumb]:bg-muted-foreground"
            : "[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary",
        )}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ScenarioControls                                                   */
/* ------------------------------------------------------------------ */

export function ScenarioControls({
  mode,
  scenario,
  onChange,
  onReset,
}: {
  mode: WeatherMode;
  scenario: ScenarioState;
  onChange: (s: ScenarioState) => void;
  onReset: () => void;
}) {
  const disabled = mode === "live";

  const update = useCallback(
    (patch: Partial<ScenarioState>) => onChange({ ...scenario, ...patch }),
    [onChange, scenario],
  );

  return (
    <div
      id="twin-scenario-controls"
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 transition-all duration-300",
        disabled && "pointer-events-none opacity-50",
      )}
      aria-disabled={disabled}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Scenario Controls
        </h3>
        <Button
          id="twin-reset-to-live"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onReset}
          className="gap-1 text-xs text-amber-400 hover:text-amber-300"
        >
          <RotateCcwIcon className="size-3.5" />
          Reset to live
        </Button>
      </div>

      <SliderRow
        id="twin-rainfall-slider"
        icon={CloudRainIcon}
        label="Rainfall Intensity"
        unit=" mm/hr"
        value={scenario.rainfall_mm_per_hr}
        min={0}
        max={100}
        step={0.5}
        disabled={disabled}
        accentClass="text-blue-400"
        onChange={(v) => update({ rainfall_mm_per_hr: v })}
      />

      <SliderRow
        id="twin-temp-slider"
        icon={ThermometerIcon}
        label="Temperature Delta"
        unit="°C"
        value={scenario.temp_delta_c}
        min={-10}
        max={15}
        step={0.5}
        disabled={disabled}
        accentClass="text-red-400"
        onChange={(v) => update({ temp_delta_c: v })}
      />

      <SliderRow
        id="twin-duration-slider"
        icon={ClockIcon}
        label="Duration"
        unit=" hrs"
        value={scenario.duration_hrs}
        min={1}
        max={24}
        step={1}
        disabled={disabled}
        accentClass="text-violet-400"
        onChange={(v) => update({ duration_hrs: v })}
      />

      {/* Location display (read-only for now) */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        <MapPinIcon className="size-4 shrink-0" />
        <span className="truncate">
          {scenario.location.lat.toFixed(4)}, {scenario.location.lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
