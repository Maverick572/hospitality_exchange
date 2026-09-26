"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { LocationField } from "@/components/location-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { routesApi } from "@/lib/api";
import { isoDate } from "@/lib/format";
import type { DriverRoute, GeoLocation } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: DriverRoute | null;
  defaultCapacity: number;
  onSaved: () => void;
};

export function RouteFormSheet({ open, onOpenChange, route, defaultCapacity, onSaved }: Props) {
  const [start, setStart] = useState<GeoLocation | null>(null);
  const [destination, setDestination] = useState<GeoLocation | null>(null);
  // Each stop keeps a stable key so its LocationField keeps its own text.
  const [stops, setStops] = useState<{ key: number; value: GeoLocation | null }[]>([]);
  const [travelDate, setTravelDate] = useState(isoDate());
  const [departureTime, setDepartureTime] = useState("10:00");
  const [arrivalTime, setArrivalTime] = useState("12:30");
  const [capacity, setCapacity] = useState(String(defaultCapacity));
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStart(route?.startLocation ?? null);
    setDestination(route?.destination ?? null);
    setStops((route?.stops ?? []).map((value, index) => ({ key: index, value })));
    setTravelDate(route?.travelDate ?? isoDate());
    setDepartureTime(route?.departureTime ?? "10:00");
    setArrivalTime(route?.arrivalTime ?? "12:30");
    setCapacity(String(route?.availableCapacity ?? defaultCapacity));
    setPrice(route ? String(route.price) : "");
    setError(null);
  }, [open, route, defaultCapacity]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!start || !destination) {
      setError("Pin both the start and destination (type an address and press Find).");
      return;
    }
    if (stops.some((stop) => !stop.value)) {
      setError("Pin every stop, or remove the empty ones.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      startLocation: start,
      destination,
      stops: stops.map((stop) => stop.value as GeoLocation),
      travelDate,
      departureTime,
      arrivalTime,
      availableCapacity: Number(capacity),
      price: Number(price),
    };
    try {
      if (route) await routesApi.update(route.routeId, payload);
      else await routesApi.create(payload);
      toast.success(route ? "Route updated" : "Route published", {
        description: route ? undefined : "We'll match deliveries that fit along the way.",
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the route.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <form onSubmit={save} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{route ? "Edit route" : "Publish a route"}</SheetTitle>
            <SheetDescription>A journey you&apos;re already making, with room to carry more.</SheetDescription>
          </SheetHeader>

          <FieldGroup className="flex-1 px-4 pb-4">
            <Field>
              <FieldLabel htmlFor="rt-from">From</FieldLabel>
              <LocationField
                id="rt-from"
                value={start}
                onChange={setStart}
                placeholder="Thane"
              />
            </Field>
            <Field>
              <FieldLabel>Stops</FieldLabel>
              <div className="flex flex-col gap-2">
                {stops.map((stop, index) => (
                  <div key={stop.key} className="flex items-start gap-1.5">
                    <LocationField
                      className="flex-1"
                      value={stop.value}
                      onChange={(value) =>
                        setStops((current) => current.map((s) => (s.key === stop.key ? { ...s, value } : s)))
                      }
                      placeholder={`Stop ${index + 1}, e.g. Vashi`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setStops((current) => current.filter((s) => s.key !== stop.key))}
                      aria-label="Remove stop"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setStops((current) => [...current, { key: Date.now(), value: null }])}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add stop
                </Button>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="rt-to">To</FieldLabel>
              <LocationField
                id="rt-to"
                value={destination}
                onChange={setDestination}
                placeholder="Nerul"
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rt-date">Date</FieldLabel>
                <Input
                  id="rt-date"
                  type="date"
                  value={travelDate}
                  min={route ? undefined : isoDate()}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                />
              </Field>
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rt-dep">Departure</FieldLabel>
                <Input id="rt-dep" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required />
              </Field>
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rt-arr">Arrival</FieldLabel>
                <Input id="rt-arr" type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="rt-cap">Available capacity (kg)</FieldLabel>
                <Input id="rt-cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="rt-price">Expected price (₹)</FieldLabel>
                <Input id="rt-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" required />
              </Field>
            </div>
            <FieldDescription>Price is for carrying a delivery along this route. Businesses see it when booking.</FieldDescription>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <SheetFooter className="border-t">
            <Button disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {route ? "Save changes" : "Publish route"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
