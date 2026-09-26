"use client";

import { useEffect, useState } from "react";
import { CrosshairIcon, MapPinIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { GeoLocation } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: GeoLocation | null;
  onChange: (value: GeoLocation | null) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Address input that resolves to coordinates, which the backend needs for
 * distance and route matching. "Find" geocodes with OpenStreetMap Nominatim
 * (free, no key); the crosshair uses the browser's location.
 */
export function LocationField({ id, value, onChange, placeholder, className }: Props) {
  const [address, setAddress] = useState(value?.address ?? "");
  const [busy, setBusy] = useState<"geocode" | "locate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Follow values set from outside (a sheet opening on an existing record).
  // Typing clears the value to null, which leaves the typed text alone.
  useEffect(() => {
    if (value?.address) setAddress(value.address);
  }, [value?.address]);

  const resolved = value && value.address === address && Number.isFinite(value.latitude);

  async function geocode() {
    const query = address.trim();
    if (!query) return;
    setBusy("geocode");
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
      if (!results.length) {
        setError("Couldn't find that place. Try adding the area or city.");
        onChange(null);
        return;
      }
      onChange({
        address: query,
        latitude: Number(results[0].lat),
        longitude: Number(results[0].lon),
      });
    } catch {
      setError("Location lookup failed. Check your connection.");
    } finally {
      setBusy(null);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("This browser can't share its location.");
      return;
    }
    setBusy("locate");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const label = address.trim() || "Current location";
        setAddress(label);
        onChange({
          address: label,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setBusy(null);
      },
      () => {
        setError("Location permission was denied.");
        setBusy(null);
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              if (value) onChange(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void geocode();
              }
            }}
            placeholder={placeholder ?? "e.g. Vashi, Navi Mumbai"}
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void geocode()}
          disabled={!address.trim() || busy !== null}
        >
          {busy === "geocode" ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
          Find
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={locate}
          disabled={busy !== null}
          aria-label="Use my current location"
          title="Use my current location"
        >
          {busy === "locate" ? <Spinner /> : <CrosshairIcon />}
        </Button>
      </div>
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error
          ? error
          : resolved
            ? `Pinned at ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
            : "Type an address and press Find so distances can be worked out."}
      </p>
    </div>
  );
}
