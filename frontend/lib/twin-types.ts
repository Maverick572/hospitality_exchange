/**
 * Digital Twin — shared type definitions
 *
 * Mirrors the state model from digital-twin-frontend-spec.md § 3
 * and the response shapes from the backend weather + twin endpoints.
 */

/* ------------------------------------------------------------------ */
/*  Mode                                                               */
/* ------------------------------------------------------------------ */

export type WeatherMode = "live" | "simulated";

/* ------------------------------------------------------------------ */
/*  Scenario inputs (slider state)                                     */
/* ------------------------------------------------------------------ */

export interface ScenarioState {
  rainfall_mm_per_hr: number;   // 0–100, default 0
  temp_delta_c: number;         // -10–+15, default 0
  duration_hrs: number;         // 1–24, default 3
  location: { lat: number; lng: number };
}

export const DEFAULT_SCENARIO: ScenarioState = {
  rainfall_mm_per_hr: 0,
  temp_delta_c: 0,
  duration_hrs: 3,
  location: { lat: 19.076, lng: 72.8777 },   // Mumbai default
};

/* ------------------------------------------------------------------ */
/*  Backend response shapes                                            */
/* ------------------------------------------------------------------ */

/** GET /api/v1/weather/current */
export interface CurrentConditions {
  temperature_c: number;
  precipitation_mm: number;
  rain_mm: number;
  snowfall_cm: number;
  is_day: boolean;
  observed_at: string;
}

export interface WeatherSnapshot {
  location: { lat: number; lng: number };
  current: CurrentConditions;
  conditionLabel: string;
  todays_rain_sum_mm: number | null;
  source: "live" | "forecast";
  fetched_at: string;
}

/** POST /api/v1/twin/simulate (future endpoint — for now simulated client-side) */
export interface ResourceImpact {
  resourceId: string;
  name: string;
  category: string;
  baseScore: number;
  adjustedScore: number;
  delta: number;
  speedMultiplier: number;
}

export interface LogisticsImpact {
  routeId: string;
  baseEtaMinutes: number;
  adjustedEtaMinutes: number;
  costMultiplier: number;
}

export interface TwinSimulateResponse {
  scenario: ScenarioState;
  conditionLabel: string;
  resourceImpact: { results: ResourceImpact[] };
  logisticsImpact: { routes: LogisticsImpact[] };
  narrative: string | null;
}

/* ------------------------------------------------------------------ */
/*  Page-level state (for reference — hook manages this internally)    */
/* ------------------------------------------------------------------ */

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface TwinPageState {
  mode: WeatherMode;
  scenario: ScenarioState;
  liveWeather: WeatherSnapshot | null;
  liveWeatherStatus: AsyncStatus;
  simResult: TwinSimulateResponse | null;
  simStatus: AsyncStatus;
  narrativeStatus: AsyncStatus;
  activeRequestId: number;
}
