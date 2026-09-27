"use client";

/**
 * useTwinSimulation — data-fetching hook for the digital twin page.
 *
 * Owns the request lifecycle from spec § 5:
 *   - Debounced "scores" call on every slider change (300 ms)
 *   - Separate "narrative" call only on settled values (~1 s idle)
 *   - AbortController + requestId staleness guard
 *   - Clears simulated state when mode flips to "live"
 *
 * Also fetches live weather on mount + 10 min poll.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "@/lib/api";
import type {
  AsyncStatus,
  ScenarioState,
  TwinSimulateResponse,
  WeatherMode,
  WeatherSnapshot,
} from "@/lib/twin-types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => { if (timer) clearTimeout(timer); };
  return debounced as T & { cancel(): void };
}

/* ------------------------------------------------------------------ */
/*  Client-side condition simulation (no backend twin endpoint yet)    */
/* ------------------------------------------------------------------ */

/** Same thresholds as backend classify_condition() for consistency. */
function classifyCondition(rainfallMmPerHr: number, tempC: number): string {
  if (rainfallMmPerHr >= 30) return "storm";
  if (rainfallMmPerHr >= 7.5) return "heavy_rain";
  if (rainfallMmPerHr >= 1) return "light_rain";
  if (tempC >= 40) return "extreme_heat";
  return "normal";
}

/** Impact multiplier table — mirrors the weather-sensitivity mapping. */
const IMPACT_TABLE: Record<string, { scoreDelta: number; speedMul: number; costMul: number }> = {
  storm:        { scoreDelta: -35, speedMul: 0.5, costMul: 1.8 },
  heavy_rain:   { scoreDelta: -20, speedMul: 0.65, costMul: 1.4 },
  light_rain:   { scoreDelta: -8,  speedMul: 0.85, costMul: 1.15 },
  extreme_heat: { scoreDelta: -15, speedMul: 0.7, costMul: 1.3 },
  normal:       { scoreDelta: 0,   speedMul: 1.0, costMul: 1.0 },
};

/** Build a mock simulate response purely client-side. */
function simulateLocally(
  scenario: ScenarioState,
  baseTemp: number,
): TwinSimulateResponse {
  const effectiveTemp = baseTemp + scenario.temp_delta_c;
  const label = classifyCondition(scenario.rainfall_mm_per_hr, effectiveTemp);
  const impact = IMPACT_TABLE[label] ?? IMPACT_TABLE.normal;

  // Seed 6 demo resources
  const categories = ["Banquet Chairs", "Refrigerated Van", "Tents & Canopies", "Catering Equipment", "Sound System", "Flower Arrangements"];
  const resourceResults = categories.map((name, i) => {
    const base = 85 - i * 5;
    return {
      resourceId: `res_demo_${i}`,
      name,
      category: name.toLowerCase().replace(/\s+/g, "_"),
      baseScore: base,
      adjustedScore: Math.max(0, Math.round(base + impact.scoreDelta * (1 + i * 0.1))),
      delta: Math.round(impact.scoreDelta * (1 + i * 0.1)),
      speedMultiplier: Math.max(0.5, impact.speedMul),
    };
  });

  // Seed 3 demo logistics routes
  const routeResults = [
    { routeId: "route_1", baseEtaMinutes: 45, adjustedEtaMinutes: Math.round(45 / impact.speedMul), costMultiplier: impact.costMul },
    { routeId: "route_2", baseEtaMinutes: 60, adjustedEtaMinutes: Math.round(60 / impact.speedMul), costMultiplier: impact.costMul },
    { routeId: "route_3", baseEtaMinutes: 30, adjustedEtaMinutes: Math.round(30 / impact.speedMul), costMultiplier: impact.costMul },
  ];

  // Simple narrative
  const narratives: Record<string, string> = {
    storm: `⛈️ Severe storm conditions detected (${scenario.rainfall_mm_per_hr} mm/hr rainfall). Outdoor resources like tents, flower arrangements, and sound systems are heavily impacted. Delivery ETAs are roughly doubled. Consider postponing outdoor events or switching to indoor alternatives.`,
    heavy_rain: `🌧️ Heavy rainfall (${scenario.rainfall_mm_per_hr} mm/hr) will moderately impact outdoor resource availability and increase delivery times by ~40%. Waterproof covers recommended for all transported goods.`,
    light_rain: `🌦️ Light rain expected (${scenario.rainfall_mm_per_hr} mm/hr). Minor impact on resource scores and slight delivery delays. Most operations can continue normally with basic precautions.`,
    extreme_heat: `🔥 Extreme heat warning (${effectiveTemp.toFixed(1)}°C). Refrigerated transport costs increase by 30%. Perishable and temperature-sensitive resources require special handling. Schedule deliveries for early morning or late evening.`,
    normal: `☀️ Normal conditions — no significant weather impact on resource availability or logistics. All scores reflect baseline performance.`,
  };

  return {
    scenario,
    conditionLabel: label,
    resourceImpact: { results: resourceResults },
    logisticsImpact: { routes: routeResults },
    narrative: narratives[label] ?? narratives.normal,
  };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const LIVE_WEATHER_POLL_MS = 10 * 60 * 1000; // 10 min
const DEBOUNCE_SCORES_MS = 300;
const DEBOUNCE_NARRATIVE_MS = 1000;

export function useTwinSimulation(scenario: ScenarioState, mode: WeatherMode) {
  /* ---- Live weather ---- */
  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot | null>(null);
  const [liveWeatherStatus, setLiveWeatherStatus] = useState<AsyncStatus>("idle");

  /* ---- Simulated result ---- */
  const [simResult, setSimResult] = useState<TwinSimulateResponse | null>(null);
  const [simStatus, setSimStatus] = useState<AsyncStatus>("idle");
  const [narrativeStatus, setNarrativeStatus] = useState<AsyncStatus>("idle");

  /* ---- Request tracking ---- */
  const controllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);

  /* ---------- Live weather fetcher ---------- */

  const fetchLiveWeather = useCallback(async (lat: number, lng: number) => {
    setLiveWeatherStatus("loading");
    try {
      const url = `${API_BASE_URL}/weather/current?lat=${lat}&lng=${lng}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API ${res.status}`);
      const data: WeatherSnapshot = await res.json();
      setLiveWeather(data);
      setLiveWeatherStatus("success");
    } catch {
      setLiveWeatherStatus("error");
    }
  }, []);

  // Poll live weather on mount + every 10 min
  useEffect(() => {
    fetchLiveWeather(scenario.location.lat, scenario.location.lng);
    const id = setInterval(
      () => fetchLiveWeather(scenario.location.lat, scenario.location.lng),
      LIVE_WEATHER_POLL_MS,
    );
    return () => clearInterval(id);
    // Re-fetch when location changes
  }, [scenario.location.lat, scenario.location.lng, fetchLiveWeather]);

  /* ---------- Simulation runner ---------- */

  const runSimulation = useCallback(
    (s: ScenarioState, includeNarrative: boolean) => {
      // Cancel in-flight request
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const requestId = ++activeRequestIdRef.current;
      setSimStatus("loading");
      if (includeNarrative) setNarrativeStatus("loading");

      // Simulate with a small async delay to feel realistic
      const timer = setTimeout(() => {
        if (controller.signal.aborted) return;
        if (requestId !== activeRequestIdRef.current) return;

        const baseTemp = liveWeather?.current.temperature_c ?? 30;
        const result = simulateLocally(s, baseTemp);

        if (!includeNarrative) {
          result.narrative = null;
        }

        setSimResult(result);
        setSimStatus("success");
        if (includeNarrative) setNarrativeStatus("success");
      }, 150 + Math.random() * 200);

      // Wire up abort
      controller.signal.addEventListener("abort", () => clearTimeout(timer));
    },
    [liveWeather],
  );

  /* ---------- Debounced triggers ---------- */

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedScores = useCallback(
    debounce((...args: unknown[]) => {
      const s = args[0] as ScenarioState;
      runSimulation(s, false);
    }, DEBOUNCE_SCORES_MS),
    [runSimulation],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedNarrative = useCallback(
    debounce((...args: unknown[]) => {
      const s = args[0] as ScenarioState;
      runSimulation(s, true);
    }, DEBOUNCE_NARRATIVE_MS),
    [runSimulation],
  );

  /* ---------- React to scenario changes ---------- */

  useEffect(() => {
    if (mode !== "simulated") return;
    debouncedScores(scenario);
    debouncedNarrative(scenario);
    return () => {
      debouncedScores.cancel();
      debouncedNarrative.cancel();
    };
  }, [mode, scenario, debouncedScores, debouncedNarrative]);

  /* ---------- Mode switch: clear sim state ---------- */

  useEffect(() => {
    if (mode === "live") {
      controllerRef.current?.abort();
      setSimResult(null);
      setSimStatus("idle");
      setNarrativeStatus("idle");
    }
  }, [mode]);

  /* ---------- Public API ---------- */

  const refetch = useCallback(() => {
    if (mode === "simulated") {
      runSimulation(scenario, true);
    } else {
      fetchLiveWeather(scenario.location.lat, scenario.location.lng);
    }
  }, [mode, scenario, runSimulation, fetchLiveWeather]);

  return {
    liveWeather,
    liveWeatherStatus,
    simResult,
    simStatus,
    narrativeStatus,
    refetch,
  };
}
