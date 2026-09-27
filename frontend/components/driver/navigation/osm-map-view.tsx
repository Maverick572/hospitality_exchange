"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CrosshairIcon, LayersIcon, Maximize2Icon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { useDriverNavigation } from "@/contexts/driver-navigation-context";
import { Button } from "@/components/ui/button";

export function OsmMapView() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const isAutoFollowingRef = useRef(true);

  const {
    activeTarget,
    currentPosition,
    routeData,
    recenterCounter,
    recenter,
  } = useDriverNavigation();

  const [isFollowing, setIsFollowing] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Mumbai
    const initialLat = currentPosition?.lat ?? 19.076;
    const initialLng = currentPosition?.lng ?? 72.8777;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Disable auto follow if user manually drags map
    map.on("dragstart", () => {
      isAutoFollowingRef.current = false;
      setIsFollowing(false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous polylines
    if (routeCasingRef.current) {
      map.removeLayer(routeCasingRef.current);
      routeCasingRef.current = null;
    }
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (!routeData?.coordinates || routeData.coordinates.length < 2) return;

    const latlngs: L.LatLngExpression[] = routeData.coordinates.map(([lat, lng]) => [lat, lng]);

    // Outer casing (glow / road boundary)
    const casing = L.polyline(latlngs, {
      color: "#1e40af",
      weight: 10,
      opacity: 0.4,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);
    routeCasingRef.current = casing;

    // Inner vivid driving polyline
    const polyline = L.polyline(latlngs, {
      color: "#2563eb",
      weight: 6,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);
    routePolylineRef.current = polyline;

    // Initially fit bounds to route
    map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
  }, [routeData]);

  // Update Waypoint Markers (Pickup, Dropoff, Stops)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeTarget?.waypoints) return;

    // Clear previous markers
    waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
    waypointMarkersRef.current = [];

    const waypoints = activeTarget.waypoints;

    waypoints.forEach((wp, index) => {
      const isFirst = index === 0;
      const isLast = index === waypoints.length - 1;

      let iconHtml = "";
      if (isFirst) {
        // Pickup / Origin Marker (Amber)
        iconHtml = `
          <div class="flex items-center justify-center size-8 rounded-full bg-amber-500 text-white font-bold text-xs shadow-lg border-2 border-white ring-2 ring-amber-500/40">
            P
          </div>
        `;
      } else if (isLast) {
        // Destination Marker (Emerald)
        iconHtml = `
          <div class="flex items-center justify-center size-8 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-lg border-2 border-white ring-2 ring-emerald-600/40">
            D
          </div>
        `;
      } else {
        // Intermediate Stop Marker
        iconHtml = `
          <div class="flex items-center justify-center size-7 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-md border-2 border-white">
            ${index}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-wp-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([wp.latitude, wp.longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-size: 13px; font-family: sans-serif; padding: 2px;">
          <b style="color: #1e293b;">${isFirst ? "Pickup Point" : isLast ? "Drop-off Destination" : `Stop #${index}`}</b>
          <p style="margin: 4px 0 0 0; color: #475569;">${wp.address}</p>
        </div>
      `);

      waypointMarkersRef.current.push(marker);
    });
  }, [activeTarget]);

  // Update Driver Vehicle Marker & Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentPosition) return;

    const { lat, lng, heading } = currentPosition;

    if (!driverMarkerRef.current) {
      const vehicleHtml = `
        <div class="driver-puck-container" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div class="driver-radar" style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: puck-pulse 1.8s infinite ease-out;"></div>
          <div id="driver-arrow-rotator" style="position: relative; width: 28px; height: 28px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.2s ease-out;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
            </svg>
          </div>
        </div>
      `;

      const driverIcon = L.divIcon({
        html: vehicleHtml,
        className: "custom-driver-puck",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([lat, lng], {
        icon: driverIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      driverMarkerRef.current = marker;
    } else {
      driverMarkerRef.current.setLatLng([lat, lng]);
      const arrowElem = document.getElementById("driver-arrow-rotator");
      if (arrowElem) {
        arrowElem.style.transform = `rotate(${heading}deg)`;
      }
    }

    // Auto-center map if following
    if (isAutoFollowingRef.current) {
      map.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  }, [currentPosition]);

  // Recenter trigger
  useEffect(() => {
    if (recenterCounter > 0 && mapInstanceRef.current && currentPosition) {
      isAutoFollowingRef.current = true;
      setIsFollowing(true);
      mapInstanceRef.current.setView([currentPosition.lat, currentPosition.lng], 16, {
        animate: true,
      });
    }
  }, [recenterCounter, currentPosition]);

  const fitFullRoute = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      isAutoFollowingRef.current = false;
      setIsFollowing(false);
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), {
        padding: [60, 60],
        maxZoom: 16,
      });
    }
  };

  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative size-full min-h-[380px] overflow-hidden rounded-2xl bg-muted/40 shadow-inner">
      {/* Inline styles for pulse animation */}
      <style jsx global>{`
        @keyframes puck-pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background: #f1f5f9;
        }
      `}</style>

      {/* Map DOM node */}
      <div ref={mapContainerRef} className="size-full" />

      {/* Floating Map Controls */}
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={recenter}
          title="Recenter on Driver"
          className={`shadow-md backdrop-blur-md transition-all ${
            isFollowing
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-background/90 text-foreground hover:bg-background"
          }`}
        >
          <CrosshairIcon className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={fitFullRoute}
          title="View Full Route"
          className="bg-background/90 shadow-md backdrop-blur-md hover:bg-background"
        >
          <Maximize2Icon className="size-4" />
        </Button>
        <div className="flex flex-col overflow-hidden rounded-lg border border-border/80 bg-background/90 shadow-md backdrop-blur-md">
          <button
            onClick={zoomIn}
            className="flex size-8 items-center justify-center border-b border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomInIcon className="size-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="flex size-8 items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOutIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Live OSM indicator badge */}
      <div className="absolute bottom-2 left-2 z-[500] flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-xs backdrop-blur-xs">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        OpenStreetMap &bull; OSRM Live
      </div>
    </div>
  );
}
