"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { LocationField } from "@/components/location-field";
import { MediaInput } from "@/components/media-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { categoriesApi, resourcesApi } from "@/lib/api";
import { CONDITIONS, PRICING_UNITS } from "@/lib/constants";
import { isoDate } from "@/lib/format";
import type { AvailabilitySlot, GeoLocation, Resource, ResourceInput } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resource being edited; omit to create a new one. */
  resource?: Resource | null;
  defaultLocation: GeoLocation | null;
  onSaved: () => void;
};

type Draft = Omit<ResourceInput, "quantity" | "price"> & { quantity: string; price: string };

function toDraft(resource: Resource | null | undefined, location: GeoLocation | null): Draft {
  return {
    name: resource?.name ?? "",
    category: resource?.category ?? "",
    description: resource?.description ?? "",
    quantity: resource ? String(resource.quantity) : "",
    price: resource ? String(resource.price) : "",
    pricingUnit: resource?.pricingUnit ?? "per_item_per_day",
    location: (resource?.location as GeoLocation | null) ?? location,
    availability: resource?.availability ?? [],
    condition: resource?.condition ?? "good",
    images: resource?.images ?? [],
  };
}

export function ResourceFormSheet({ open, onOpenChange, resource, defaultLocation, onSaved }: Props) {
  const categories = useApi(categoriesApi.list);
  const [draft, setDraft] = useState<Draft>(() => toDraft(resource, defaultLocation));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(resource);

  useEffect(() => {
    if (open) {
      setDraft(toDraft(resource, defaultLocation));
      setError(null);
    }
  }, [open, resource, defaultLocation]);

  const selectedCategory = categories.data?.find((c) => c.id === draft.category);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSlot(index: number, slot: Partial<AvailabilitySlot>) {
    update(
      "availability",
      draft.availability.map((item, i) => (i === index ? { ...item, ...slot } : item)),
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.location) {
      setError("Set the pickup location (type an address and press Find).");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: ResourceInput = {
      ...draft,
      quantity: Number(draft.quantity),
      price: Number(draft.price),
      availability: draft.availability.filter((slot) => slot.date && slot.quantity > 0),
    };
    try {
      if (resource) await resourcesApi.update(resource.resourceId, payload);
      else await resourcesApi.create(payload);
      toast.success(editing ? "Resource updated" : "Resource listed", {
        description: editing ? undefined : "It now shows up in marketplace searches.",
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the resource.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <form onSubmit={save} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit resource" : "List a resource"}</SheetTitle>
            <SheetDescription>
              Seekers find this through plain-language search, so a clear name and category matter most.
            </SheetDescription>
          </SheetHeader>

          <FieldGroup className="flex-1 px-4 pb-4">
            <Field>
              <FieldLabel htmlFor="res-name">Resource name</FieldLabel>
              <Input
                id="res-name"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Banquet chairs (gold chiavari)"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="res-category">Category</FieldLabel>
              {categories.data ? (
                <NativeSelect
                  id="res-category"
                  className="w-full"
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  required
                >
                  <NativeSelectOption value="" disabled>
                    Choose a category
                  </NativeSelectOption>
                  {categories.data.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <Input
                  id="res-category"
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder={categories.loading ? "Loading categories…" : "e.g. banquet_seating"}
                  required
                />
              )}
              {selectedCategory && (
                <FieldDescription>
                  Condition proof for this category: {selectedCategory.evidenceType.replace("_", " + ")}.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="res-desc">Description</FieldLabel>
              <Textarea
                id="res-desc"
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Padded seats, stackable, includes covers."
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="res-qty">Quantity</FieldLabel>
                <Input
                  id="res-qty"
                  type="number"
                  min={1}
                  value={draft.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-condition">Condition</FieldLabel>
                <NativeSelect
                  id="res-condition"
                  className="w-full"
                  value={draft.condition}
                  onChange={(e) => update("condition", e.target.value)}
                >
                  {CONDITIONS.map((c) => (
                    <NativeSelectOption key={c.value} value={c.value}>
                      {c.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="res-price">Price (₹)</FieldLabel>
                <Input
                  id="res-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => update("price", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="res-unit">Pricing unit</FieldLabel>
                <NativeSelect
                  id="res-unit"
                  className="w-full"
                  value={draft.pricingUnit}
                  onChange={(e) => update("pricingUnit", e.target.value)}
                >
                  {PRICING_UNITS.map((u) => (
                    <NativeSelectOption key={u.value} value={u.value}>
                      {u.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="res-location">Pickup location</FieldLabel>
              <LocationField
                id="res-location"
                value={draft.location}
                onChange={(value) => update("location", value)}
              />
            </Field>
            <Field>
              <FieldLabel>Availability</FieldLabel>
              <FieldDescription>
                Optional. Leave empty if it&apos;s generally available; add dates to limit quantities on specific days.
              </FieldDescription>
              <div className="flex flex-col gap-2">
                {draft.availability.map((slot, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="date"
                      value={slot.date}
                      min={isoDate()}
                      onChange={(e) => updateSlot(index, { date: e.target.value })}
                      aria-label="Date"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={slot.quantity}
                      onChange={(e) => updateSlot(index, { quantity: Number(e.target.value) })}
                      className="w-28"
                      aria-label="Quantity available"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => update("availability", draft.availability.filter((_, i) => i !== index))}
                      aria-label="Remove date"
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
                  onClick={() =>
                    update("availability", [
                      ...draft.availability,
                      { date: isoDate(), quantity: Number(draft.quantity) || 0 },
                    ])
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  Add date
                </Button>
              </div>
            </Field>
            <Field>
              <FieldLabel>Product Photos</FieldLabel>
              <FieldDescription>
                Upload photos of your product, equipment, or venue. The first photo will be used as the cover photo. Stored directly with your listing in Firestore.
              </FieldDescription>
              <MediaInput value={draft.images} onChange={(value) => update("images", value)} folder="resources" max={6} />
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <SheetFooter className="border-t">
            <Button disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {editing ? "Save changes" : "List resource"}
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
