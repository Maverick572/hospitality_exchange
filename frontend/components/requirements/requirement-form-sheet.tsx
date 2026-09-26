"use client";

import { useEffect, useState } from "react";
import { SparklesIcon, TagIcon } from "lucide-react";
import { toast } from "sonner";

import { LocationField } from "@/components/location-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { requirementsApi } from "@/lib/api";
import { humanize, isoDate } from "@/lib/format";
import type { GeoLocation, ParsedItem, Requirement } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement?: Requirement | null;
  defaultLocation: GeoLocation | null;
  onSaved: (requirement: Requirement | null) => void;
};

export function RequirementFormSheet({ open, onOpenChange, requirement, defaultLocation, onSaved }: Props) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(defaultLocation);
  const [requiredDate, setRequiredDate] = useState(isoDate(tomorrow));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");
  const [budget, setBudget] = useState("");
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [preview, setPreview] = useState<ParsedItem[] | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDescription(requirement?.description ?? "");
    setLocation((requirement?.location as GeoLocation | null) ?? defaultLocation);
    setRequiredDate(requirement?.requiredDate?.slice(0, 10) ?? isoDate(tomorrow));
    setStartTime(requirement?.startTime ?? "10:00");
    setEndTime(requirement?.endTime ?? "22:00");
    setBudget(requirement?.budget ? String(requirement.budget) : "");
    setDeliveryRequired(requirement?.deliveryRequired ?? true);
    setPreview(requirement?.items ?? null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requirement, defaultLocation]);

  async function runPreview() {
    if (!description.trim()) return;
    setPreviewing(true);
    try {
      const parsed = await requirementsApi.parse(description.trim());
      setPreview(parsed.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read that requirement.");
    } finally {
      setPreviewing(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) {
      setError("Set the delivery location (type an address and press Find).");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      description: description.trim(),
      location,
      requiredDate,
      startTime,
      endTime,
      budget: budget ? Number(budget) : null,
      deliveryRequired,
    };
    try {
      const saved = requirement
        ? await requirementsApi.update(requirement.requirementId, payload)
        : await requirementsApi.create(payload);
      toast.success(requirement ? "Requirement updated" : "Requirement saved");
      onSaved(saved ?? null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the requirement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <form onSubmit={save} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{requirement ? "Edit requirement" : "Post a requirement"}</SheetTitle>
            <SheetDescription>Save what you need, then find matching providers whenever you&apos;re ready.</SheetDescription>
          </SheetHeader>

          <FieldGroup className="flex-1 px-4 pb-4">
            <Field>
              <FieldLabel htmlFor="rq-desc">What do you need?</FieldLabel>
              <Textarea
                id="rq-desc"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setPreview(null);
                }}
                placeholder="I need 300 chairs and 20 tables in Vashi tomorrow. Delivery required before 3 PM."
                rows={4}
                required
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void runPreview()}
                  disabled={previewing || !description.trim()}
                >
                  {previewing ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                  Preview items
                </Button>
                {preview?.map((item) => (
                  <Badge key={`${item.name}-${item.category}`} variant="secondary" className="gap-1 font-normal">
                    <TagIcon className="size-3" />
                    {humanize(item.category)}: {item.name} × {item.quantity}
                  </Badge>
                ))}
                {preview && preview.length === 0 && (
                  <span className="text-xs text-muted-foreground">No items recognised. Try naming quantities.</span>
                )}
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="rq-location">Delivery location</FieldLabel>
              <LocationField id="rq-location" value={location} onChange={setLocation} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rq-date">Date</FieldLabel>
                <Input
                  id="rq-date"
                  type="date"
                  value={requiredDate}
                  min={isoDate()}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  required
                />
              </Field>
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rq-start">Start</FieldLabel>
                <Input id="rq-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Field>
              <Field className="col-span-3 sm:col-span-1">
                <FieldLabel htmlFor="rq-end">End</FieldLabel>
                <Input id="rq-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="rq-budget">Budget (₹)</FieldLabel>
              <Input
                id="rq-budget"
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="25000"
              />
              <FieldDescription>Optional. Used to flag bundles that go over.</FieldDescription>
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium">Delivery required</span>
                <span className="block text-xs text-muted-foreground">We&apos;ll look for drivers on matching routes.</span>
              </span>
              <Switch checked={deliveryRequired} onCheckedChange={setDeliveryRequired} />
            </label>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <SheetFooter className="border-t">
            <Button disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {requirement ? "Save changes" : "Save requirement"}
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
