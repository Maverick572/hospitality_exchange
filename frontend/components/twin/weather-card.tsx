"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeatherSnapshot } from "@/lib/twin-types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ThermometerIcon,
  DropletIcon,
  SnowflakeIcon,
  SunIcon,
  MoonIcon,
  CloudRainIcon,
  AlertTriangleIcon,
} from "lucide-react";

/**
 * Live weather display card — shows current conditions fetched from
 * GET /api/v1/weather/current. Small inline warning if the fetch failed
 * (spec § 6: weather API failure doesn't block the page).
 */
export function WeatherCard({
  weather,
  status,
}: {
  weather: WeatherSnapshot | null;
  status: string;
}) {
  if (status === "loading") {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">🌤️ Current Weather</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error" || !weather) {
    return (
      <Card size="sm" className="border-amber-500/20">
        <CardContent className="flex items-center gap-2 py-4">
          <AlertTriangleIcon className="size-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">
            Live weather unavailable — simulated mode still works
          </p>
        </CardContent>
      </Card>
    );
  }

  const c = weather.current;
  const conditionColors: Record<string, string> = {
    storm: "text-red-400",
    heavy_rain: "text-orange-400",
    light_rain: "text-blue-400",
    extreme_heat: "text-red-400",
    normal: "text-emerald-400",
  };

  const conditionLabels: Record<string, string> = {
    storm: "⛈️ Storm",
    heavy_rain: "🌧️ Heavy Rain",
    light_rain: "🌦️ Light Rain",
    extreme_heat: "🔥 Extreme Heat",
    normal: "☀️ Normal",
  };

  return (
    <Card size="sm" className="bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {c.is_day ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-blue-300" />}
            Current Weather
          </span>
          <span className={cn("text-xs font-semibold", conditionColors[weather.conditionLabel] ?? "text-foreground")}>
            {conditionLabels[weather.conditionLabel] ?? weather.conditionLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            {c.temperature_c}
          </span>
          <span className="text-lg text-muted-foreground">°C</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 px-2 py-2">
            <DropletIcon className="size-4 text-blue-400" />
            <span className="text-xs font-medium tabular-nums">{c.rain_mm} mm</span>
            <span className="text-[10px] text-muted-foreground">Rain</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 px-2 py-2">
            <CloudRainIcon className="size-4 text-blue-300" />
            <span className="text-xs font-medium tabular-nums">{c.precipitation_mm} mm</span>
            <span className="text-[10px] text-muted-foreground">Precip</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 px-2 py-2">
            <SnowflakeIcon className="size-4 text-sky-300" />
            <span className="text-xs font-medium tabular-nums">{c.snowfall_cm} cm</span>
            <span className="text-[10px] text-muted-foreground">Snow</span>
          </div>
        </div>

        {weather.todays_rain_sum_mm !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Today&apos;s total rain: <span className="font-medium text-foreground">{weather.todays_rain_sum_mm.toFixed(1)} mm</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
