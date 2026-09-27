/**
 * OpenStreetMap / OSRM Routing Service for Driver GPS Navigation
 * Queries OSRM for real driving geometry, distances, and turn-by-turn steps,
 * with a reliable offline/fallback path generator.
 */

export type NavigationManeuver =
  | "depart"
  | "turn"
  | "new name"
  | "arrive"
  | "roundabout"
  | "merge"
  | "fork"
  | "continue";

export type NavigationModifier =
  | "left"
  | "right"
  | "slight left"
  | "slight right"
  | "sharp left"
  | "sharp right"
  | "straight"
  | "uturn";

export type NavigationStep = {
  id: string;
  instruction: string;
  maneuver: NavigationManeuver | string;
  modifier?: NavigationModifier | string;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
  location: [number, number]; // [lat, lng]
};

export type RouteResult = {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  distanceMeters: number;
  durationSeconds: number;
  steps: NavigationStep[];
  source: "osrm" | "fallback";
};

const OSRM_PUBLIC_URL = "https://router.project-osrm.org";

/**
 * Calculate Haversine distance in meters between two lat/lng points.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format human-readable distance (e.g. "350 m" or "4.2 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format remaining duration (e.g. "14 min" or "1 hr 12 min").
 */
export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} hr ${remMins} min` : `${hrs} hr`;
}

/**
 * Build clear driving instruction text from OSRM maneuver and modifier.
 */
function buildInstruction(type: string, modifier?: string, name?: string): string {
  const street = name && name.trim() ? name.trim() : "road";

  switch (type) {
    case "depart":
      return `Head out on ${street}`;
    case "arrive":
      return "Arrive at your destination";
    case "roundabout":
    case "rotary":
      return `At the roundabout, take exit onto ${street}`;
    case "merge":
      return `Merge onto ${street}`;
    case "fork":
      return modifier?.includes("left")
        ? `Keep left at fork onto ${street}`
        : `Keep right at fork onto ${street}`;
    case "turn":
    case "new name":
    case "end of road":
      if (modifier === "left") return `Turn left onto ${street}`;
      if (modifier === "right") return `Turn right onto ${street}`;
      if (modifier === "slight left") return `Slight left onto ${street}`;
      if (modifier === "slight right") return `Slight right onto ${street}`;
      if (modifier === "sharp left") return `Sharp left onto ${street}`;
      if (modifier === "sharp right") return `Sharp right onto ${street}`;
      if (modifier === "uturn") return `Make a U-turn onto ${street}`;
      return `Continue onto ${street}`;
    default:
      if (modifier === "left") return `Turn left onto ${street}`;
      if (modifier === "right") return `Turn right onto ${street}`;
      return `Continue straight on ${street}`;
  }
}

/**
 * Generate fallback route geometry and turn steps when OSRM is offline.
 */
export function generateFallbackRoute(
  waypoints: [number, number][]
): RouteResult {
  if (waypoints.length < 2) {
    return {
      coordinates: waypoints,
      distanceMeters: 0,
      durationSeconds: 0,
      steps: [],
      source: "fallback",
    };
  }

  const coordinates: [number, number][] = [];
  const steps: NavigationStep[] = [];
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const legDistance = haversineDistanceMeters(start[0], start[1], end[0], end[1]);
    const roadDistance = Math.round(legDistance * 1.35); // Urban winding factor
    totalDistance += roadDistance;

    // Interpolate points with slight road curve
    const stepsCount = 18;
    for (let j = 0; j <= stepsCount; j++) {
      const t = j / stepsCount;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      // Add small realistic road deviation
      const curve = Math.sin(t * Math.PI) * 0.0018 * (i % 2 === 0 ? 1 : -1);
      coordinates.push([lat + curve, lng + curve]);
    }

    if (i === 0) {
      steps.push({
        id: `step_${i}_start`,
        instruction: "Head toward delivery corridor",
        maneuver: "depart",
        modifier: "straight",
        distanceMeters: Math.round(roadDistance * 0.4),
        durationSeconds: Math.round((roadDistance * 0.4) / 8),
        streetName: "Main Transit Way",
        location: start,
      });
      steps.push({
        id: `step_${i}_mid`,
        instruction: "Continue straight on highway corridor",
        maneuver: "turn",
        modifier: "straight",
        distanceMeters: Math.round(roadDistance * 0.6),
        durationSeconds: Math.round((roadDistance * 0.6) / 8),
        streetName: "Expressway Connector",
        location: [start[0] + (end[0] - start[0]) * 0.4, start[1] + (end[1] - start[1]) * 0.4],
      });
    } else {
      steps.push({
        id: `step_${i}_turn`,
        instruction: "Turn toward next delivery destination",
        maneuver: "turn",
        modifier: i % 2 === 0 ? "right" : "left",
        distanceMeters: roadDistance,
        durationSeconds: Math.round(roadDistance / 8),
        streetName: "Connecting Link Road",
        location: start,
      });
    }
  }

  const last = waypoints[waypoints.length - 1];
  steps.push({
    id: "step_arrive",
    instruction: "Arrive at destination",
    maneuver: "arrive",
    modifier: "straight",
    distanceMeters: 0,
    durationSeconds: 0,
    streetName: "Destination",
    location: last,
  });

  // Mumbai transit speed ~ 25 km/h = ~7 m/s + 5 min loading buffer
  const durationSeconds = Math.round(totalDistance / 7) + 300;

  return {
    coordinates,
    distanceMeters: totalDistance,
    durationSeconds,
    steps,
    source: "fallback",
  };
}

/**
 * Fetch driving route from OSRM with full geometry and turn steps.
 * Automatically falls back to high-resolution generated geometry if unavailable.
 */
export async function fetchDrivingRoute(
  waypoints: [number, number][],
  timeoutMs: number = 4000
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    return generateFallbackRoute(waypoints);
  }

  try {
    // OSRM coordinates format: lng,lat;lng,lat
    const coordsStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `${OSRM_PUBLIC_URL}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);

    if (!resp.ok) {
      throw new Error(`OSRM HTTP error: ${resp.status}`);
    }

    const data = await resp.json();
    if (data.code !== "Ok" || !data.routes || !data.routes.length) {
      throw new Error(`OSRM response code: ${data.code}`);
    }

    const route = data.routes[0];
    // GeoJSON coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
    const coordinates: [number, number][] = (route.geometry?.coordinates ?? []).map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const steps: NavigationStep[] = [];
    let stepIdCounter = 1;

    for (const leg of route.legs ?? []) {
      for (const step of leg.steps ?? []) {
        const maneuverType = step.maneuver?.type ?? "turn";
        const modifier = step.maneuver?.modifier;
        const streetName = step.name || "";
        const location: [number, number] = step.maneuver?.location
          ? [step.maneuver.location[1], step.maneuver.location[0]]
          : [0, 0];

        steps.push({
          id: `step_${stepIdCounter++}`,
          instruction: buildInstruction(maneuverType, modifier, streetName),
          maneuver: maneuverType,
          modifier,
          distanceMeters: Math.round(step.distance ?? 0),
          durationSeconds: Math.round(step.duration ?? 0),
          streetName,
          location,
        });
      }
    }

    return {
      coordinates: coordinates.length ? coordinates : waypoints,
      distanceMeters: Math.round(route.distance ?? 0),
      durationSeconds: Math.round(route.duration ?? 0),
      steps,
      source: "osrm",
    };
  } catch {
    // Graceful fallback when OSRM is slow, down, or offline
    return generateFallbackRoute(waypoints);
  }
}
