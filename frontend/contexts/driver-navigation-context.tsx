"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  fetchDrivingRoute,
  haversineDistanceMeters,
  type NavigationStep,
  type RouteResult,
} from "@/lib/services/osrm-routing";
import { driversApi } from "@/lib/api";
import type { DeliveryStatus, GeoLocation } from "@/lib/types";

export type NavigationWaypoint = {
  address: string;
  latitude: number;
  longitude: number;
  role?: "start" | "pickup" | "delivery" | "stop" | "destination";
  label?: string;
};

export type NavigationTarget = {
  type: "booking" | "route" | "sample";
  id: string;
  title: string;
  waypoints: NavigationWaypoint[];
  currentStatus?: DeliveryStatus;
  earnings?: number;
};

export type DriverPosition = {
  lat: number;
  lng: number;
  heading: number; // 0 to 360 degrees
  speed: number; // km/h
  accuracy: number; // meters
};

export type NavigationContextValue = {
  activeTarget: NavigationTarget | null;
  isNavigating: boolean;
  isMinimized: boolean;
  trackingMode: "live" | "simulation";
  currentPosition: DriverPosition | null;
  routeData: RouteResult | null;
  currentStepIndex: number;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  simulationSpeed: 1 | 2 | 5;
  isSimulationPaused: boolean;
  isLoadingRoute: boolean;
  recenterCounter: number;
  startNavigation: (target: NavigationTarget) => Promise<void>;
  stopNavigation: () => void;
  toggleMinimize: () => void;
  recenter: () => void;
  setTrackingMode: (mode: "live" | "simulation") => void;
  setSimulationSpeed: (speed: 1 | 2 | 5) => void;
  setSimulationPaused: (paused: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  advanceDeliveryStatus?: (status: DeliveryStatus) => Promise<void>;
};

const DriverNavigationContext = createContext<NavigationContextValue | null>(null);

export function DriverNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTarget, setActiveTarget] = useState<NavigationTarget | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [trackingMode, setTrackingMode] = useState<"live" | "simulation">("live");
  const [currentPosition, setCurrentPosition] = useState<DriverPosition | null>(null);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState(0);
  const [remainingDurationSeconds, setRemainingDurationSeconds] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2 | 5>(2);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [recenterCounter, setRecenterCounter] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const prevPositionRef = useRef<DriverPosition | null>(null);
  const simCoordIndexRef = useRef(0);
  const lastBackendSyncRef = useRef(0);

  // Recenter map trigger
  const recenter = useCallback(() => {
    setRecenterCounter((c) => c + 1);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((m) => !m);
  }, []);

  // Calculate bearing between two points
  const calculateBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  };

  // Sync location to backend silently
  const syncLocationToBackend = useCallback(
    async (pos: DriverPosition, bookingId?: string) => {
      const now = Date.now();
      if (now - lastBackendSyncRef.current < 10000) return; // Sync at most every 10s
      lastBackendSyncRef.current = now;

      try {
        await driversApi.updateLocation({
          latitude: pos.lat,
          longitude: pos.lng,
          heading: pos.heading,
          speed: pos.speed,
          bookingId: bookingId || undefined,
        });
      } catch {
        // Silent failure - do not interrupt driver navigation
      }
    },
    []
  );

  // Stop navigation
  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
    setIsMinimized(false);
    setActiveTarget(null);
    setRouteData(null);
    setCurrentPosition(null);
    setCurrentStepIndex(0);
    simCoordIndexRef.current = 0;
    toast.info("Navigation session ended");
  }, []);

  // Start Navigation session
  const startNavigation = useCallback(
    async (target: NavigationTarget) => {
      if (!target.waypoints || target.waypoints.length < 2) {
        toast.error("At least two locations (pickup and destination) are required.");
        return;
      }

      setIsNavigating(true);
      setIsMinimized(false);
      setActiveTarget(target);
      setIsLoadingRoute(true);
      setCurrentStepIndex(0);
      simCoordIndexRef.current = 0;

      const waypointCoords: [number, number][] = target.waypoints.map((w) => [
        w.latitude,
        w.longitude,
      ]);

      // Initial fallback position
      const initialPos: DriverPosition = {
        lat: waypointCoords[0][0],
        lng: waypointCoords[0][1],
        heading: calculateBearing(
          waypointCoords[0][0],
          waypointCoords[0][1],
          waypointCoords[1][0],
          waypointCoords[1][1]
        ),
        speed: 0,
        accuracy: 10,
      };
      setCurrentPosition(initialPos);
      prevPositionRef.current = initialPos;

      try {
        const route = await fetchDrivingRoute(waypointCoords);
        setRouteData(route);
        setRemainingDistanceMeters(route.distanceMeters);
        setRemainingDurationSeconds(route.durationSeconds);
        toast.success(`Route calculated via ${route.source === "osrm" ? "OSM/OSRM" : "OSM Network"}`);
      } catch (err) {
        console.error("Failed to load route:", err);
        toast.error("Could not calculate road route. Falling back to direct path.");
      } finally {
        setIsLoadingRoute(false);
      }

      // Check device GPS
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            let heading = pos.coords.heading ?? 0;
            const speed = Math.max(0, Math.round((pos.coords.speed ?? 0) * 3.6)); // m/s to km/h

            if (prevPositionRef.current && (heading === null || isNaN(heading) || heading === 0)) {
              const movedDist = haversineDistanceMeters(
                prevPositionRef.current.lat,
                prevPositionRef.current.lng,
                lat,
                lng
              );
              if (movedDist > 3) {
                heading = calculateBearing(
                  prevPositionRef.current.lat,
                  prevPositionRef.current.lng,
                  lat,
                  lng
                );
              } else {
                heading = prevPositionRef.current.heading;
              }
            }

            const newPos: DriverPosition = {
              lat,
              lng,
              heading,
              speed,
              accuracy: pos.coords.accuracy ?? 15,
            };

            prevPositionRef.current = newPos;
            setCurrentPosition(newPos);
            void syncLocationToBackend(newPos, target.type === "booking" ? target.id : undefined);
          },
          (err) => {
            console.warn("Geolocation watch error or permission denied:", err.message);
            // Default to simulation mode if device GPS is denied/unavailable
            setTrackingMode("simulation");
            toast.info("GPS unavailable. Switched to Simulation / Demo Mode.");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000,
          }
        );
      } else {
        setTrackingMode("simulation");
      }
    },
    [syncLocationToBackend]
  );

  // Auto-advance step when within 35 meters of step location (in Live mode)
  useEffect(() => {
    if (!isNavigating || trackingMode !== "live" || !currentPosition || !routeData?.steps.length) {
      return;
    }
    const currentStep = routeData.steps[currentStepIndex];
    if (!currentStep) return;

    const distToStep = haversineDistanceMeters(
      currentPosition.lat,
      currentPosition.lng,
      currentStep.location[0],
      currentStep.location[1]
    );

    if (distToStep < 35 && currentStepIndex < routeData.steps.length - 1) {
      setCurrentStepIndex((idx) => idx + 1);
    }
  }, [isNavigating, trackingMode, currentPosition, routeData, currentStepIndex]);

  // Simulation loop (for Demo purposes)
  useEffect(() => {
    if (
      !isNavigating ||
      trackingMode !== "simulation" ||
      isSimulationPaused ||
      !routeData?.coordinates.length
    ) {
      return;
    }

    const coords = routeData.coordinates;
    const totalPoints = coords.length;
    if (totalPoints < 2) return;

    // Interval time (ms) based on simulationSpeed
    const intervalMs = simulationSpeed === 5 ? 200 : simulationSpeed === 2 ? 400 : 800;

    const timer = setInterval(() => {
      simCoordIndexRef.current += 1;
      const index = simCoordIndexRef.current;

      if (index >= totalPoints - 1) {
        // Arrived at destination!
        const finalCoord = coords[totalPoints - 1];
        setCurrentPosition({
          lat: finalCoord[0],
          lng: finalCoord[1],
          heading: 0,
          speed: 0,
          accuracy: 5,
        });
        setCurrentStepIndex(Math.max(0, (routeData.steps.length ?? 1) - 1));
        setRemainingDistanceMeters(0);
        setRemainingDurationSeconds(0);
        setIsSimulationPaused(true);
        toast.success("Destination reached! Delivery location arrived.");
        clearInterval(timer);
        return;
      }

      const currentCoord = coords[index];
      const nextCoord = coords[Math.min(index + 1, totalPoints - 1)];

      const heading = calculateBearing(
        currentCoord[0],
        currentCoord[1],
        nextCoord[0],
        nextCoord[1]
      );

      const simSpeedKmh = simulationSpeed === 5 ? 85 : simulationSpeed === 2 ? 45 : 28;

      const updatedPos: DriverPosition = {
        lat: currentCoord[0],
        lng: currentCoord[1],
        heading,
        speed: simSpeedKmh,
        accuracy: 10,
      };

      setCurrentPosition(updatedPos);
      prevPositionRef.current = updatedPos;

      // Update remaining distance and duration dynamically
      const fractionRemaining = 1 - index / totalPoints;
      setRemainingDistanceMeters(Math.round(routeData.distanceMeters * fractionRemaining));
      setRemainingDurationSeconds(Math.round(routeData.durationSeconds * fractionRemaining));

      // Check step advancement in simulation
      if (routeData.steps.length > 0) {
        const nextStep = routeData.steps[currentStepIndex];
        if (nextStep) {
          const distToManeuver = haversineDistanceMeters(
            currentCoord[0],
            currentCoord[1],
            nextStep.location[0],
            nextStep.location[1]
          );
          if (distToManeuver < 50 && currentStepIndex < routeData.steps.length - 1) {
            setCurrentStepIndex((i) => i + 1);
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    isNavigating,
    trackingMode,
    isSimulationPaused,
    routeData,
    simulationSpeed,
    currentStepIndex,
  ]);

  return (
    <DriverNavigationContext.Provider
      value={{
        activeTarget,
        isNavigating,
        isMinimized,
        trackingMode,
        currentPosition,
        routeData,
        currentStepIndex,
        remainingDistanceMeters,
        remainingDurationSeconds,
        simulationSpeed,
        isSimulationPaused,
        isLoadingRoute,
        recenterCounter,
        startNavigation,
        stopNavigation,
        toggleMinimize,
        recenter,
        setTrackingMode,
        setSimulationSpeed,
        setSimulationPaused: setIsSimulationPaused,
        setCurrentStepIndex,
      }}
    >
      {children}
    </DriverNavigationContext.Provider>
  );
}

export function useDriverNavigation() {
  const context = useContext(DriverNavigationContext);
  if (!context) {
    throw new Error("useDriverNavigation must be used within a DriverNavigationProvider");
  }
  return context;
}
