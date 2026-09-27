"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  CrosshairIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

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
  autoLocate?: boolean;
};

const POPULAR_HUBS = [
  "Bandra West, Mumbai",
  "Bandra Kurla Complex (BKC)",
  "Andheri East, Mumbai",
  "Powai, Mumbai",
  "Worli, Mumbai",
  "Dadar, Mumbai",
  "Thane West",
  "Vashi, Navi Mumbai",
  "Colaba, Mumbai",
];

/**
 * Address input that resolves to real OpenStreetMap coordinates.
 * Uses the server-side /api/geocode proxy to prevent Nominatim 403 Forbidden errors,
 * supports reverse-geocoding from device GPS, and auto-geocodes on blur.
 */
export function LocationField({
  id,
  value,
  onChange,
  placeholder,
  className,
  autoLocate = false,
}: Props) {
  const [address, setAddress] = useState(value?.address ?? "");
  const [busy, setBusy] = useState<"geocode" | "locate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync external changes
  useEffect(() => {
    if (value?.address) {
      setAddress(value.address);
    }
  }, [value?.address]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolved =
    value &&
    value.address === address &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude);

  async function geocode(textToSearch?: string) {
    const query = (textToSearch ?? address).trim();
    if (!query) return;

    setBusy("geocode");
    setError(null);
    setShowSuggestions(false);

    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const res = await resp.json();

      if (!res.success || !res.data) {
        setError(res.error || "Couldn't find that place. Try adding the area or city.");
        onChange(null);
        return;
      }

      const { address: resolvedAddr, latitude, longitude } = res.data;
      setAddress(resolvedAddr);
      onChange({
        address: resolvedAddr,
        latitude,
        longitude,
      });
    } catch {
      setError("Location lookup failed. Check your internet connection.");
    } finally {
      setBusy(null);
    }
  }

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser cannot share its location.");
      return;
    }

    setBusy("locate");
    setError(null);
    setShowSuggestions(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Reverse-geocode to get friendly area name
          const resp = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const res = await resp.json();

          if (res.success && res.data?.address) {
            const resolvedAddr = res.data.address;
            setAddress(resolvedAddr);
            onChange({
              address: resolvedAddr,
              latitude: lat,
              longitude: lon,
            });
          } else {
            const fallbackLabel = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
            setAddress(fallbackLabel);
            onChange({
              address: fallbackLabel,
              latitude: lat,
              longitude: lon,
            });
          }
        } catch {
          const fallbackLabel = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          setAddress(fallbackLabel);
          onChange({
            address: fallbackLabel,
            latitude: lat,
            longitude: lon,
          });
        } finally {
          setBusy(null);
        }
      },
      (err) => {
        console.warn("GPS Geolocation error:", err);
        setError("GPS permission denied or timed out. Please type your location.");
        setBusy(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // Handle input text changes & show matching suggestions
  function handleTextChange(val: string) {
    setAddress(val);
    setError(null);
    if (value) onChange(null);

    const norm = val.toLowerCase().trim();
    if (norm.length >= 2) {
      const matches = POPULAR_HUBS.filter((h) => h.toLowerCase().includes(norm));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleSelectSuggestion(hubName: string) {
    setAddress(hubName);
    setShowSuggestions(false);
    void geocode(hubName);
  }

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            value={address}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              if (address.length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void geocode();
              }
            }}
            onBlur={() => {
              // Auto-geocode on blur if user typed an address and haven't pinned yet
              if (address.trim().length >= 3 && !value) {
                void geocode();
              }
            }}
            placeholder={placeholder ?? "e.g. Bandra West, Mumbai"}
            className={cn("pl-8 pr-8", resolved && "border-emerald-500/60 ring-1 ring-emerald-500/20")}
          />
          {resolved && (
            <CheckCircle2Icon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void geocode()}
          disabled={!address.trim() || busy !== null}
          className="font-medium shadow-2xs"
        >
          {busy === "geocode" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SearchIcon data-icon="inline-start" />
          )}
          Find
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={locate}
          disabled={busy !== null}
          aria-label="Use my current GPS location"
          title="Use my current GPS location"
          className="shadow-2xs"
        >
          {busy === "locate" ? <Spinner /> : <CrosshairIcon className="size-4 text-primary" />}
        </Button>
      </div>

      {/* Auto-suggest dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 top-[42px] z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg backdrop-blur-md">
          {suggestions.map((sug) => (
            <li
              key={sug}
              onMouseDown={() => handleSelectSuggestion(sug)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted font-medium"
            >
              <SparklesIcon className="size-3 text-amber-500 shrink-0" />
              <span>{sug}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Helpful Status feedback */}
      <div className="flex items-center justify-between text-xs">
        <p className={cn(error ? "text-destructive font-medium" : "text-muted-foreground")}>
          {error
            ? error
            : resolved && value?.latitude != null && value?.longitude != null
            ? `Pinned at ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
            : "Type an area or click crosshair to auto-detect."}
        </p>
        {!resolved && !error && address.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => void geocode()}
            className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
          >
            Click to pin
          </button>
        )}
      </div>
    </div>
  );
}
