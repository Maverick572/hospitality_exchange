"use client";

import { useState } from "react";
import { CameraIcon, ImageIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { MediaInput } from "@/components/media-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { evidenceApi } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { ConditionEvidence } from "@/lib/types";

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

export function EvidenceDialog({
  bookingId,
  open,
  onOpenChange,
  onSaved,
  defaultStage = "PICKUP",
}: {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  defaultStage?: "PICKUP" | "DELIVERY";
}) {
  const [stage, setStage] = useState<"PICKUP" | "DELIVERY">(defaultStage);
  const [media, setMedia] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!media.length) {
      setError("Add at least one photo or video.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // One evidence record per file, as the API stores a single URL each.
      for (const url of media) {
        await evidenceApi.create({
          bookingId,
          stage,
          type: "resource_condition",
          imageUrl: url,
          mediaType: VIDEO.test(url) ? "video" : "photo",
          description,
        });
      }
      toast.success("Condition evidence saved");
      setMedia([]);
      setDescription("");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the evidence.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record condition</DialogTitle>
          <DialogDescription>
            Photos or video of the items at handover. They protect both sides if something is damaged.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-2">
          <Tabs value={stage} onValueChange={(value) => setStage(value as typeof stage)}>
            <TabsList className="w-full">
              <TabsTrigger value="PICKUP">At pickup</TabsTrigger>
              <TabsTrigger value="DELIVERY">At delivery</TabsTrigger>
            </TabsList>
          </Tabs>
          <Field>
            <FieldLabel>Photos / video</FieldLabel>
            <MediaInput value={media} onChange={setMedia} folder={`evidence/${bookingId}`} accept="image/*,video/*" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ev-desc">Notes</FieldLabel>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="All 250 chairs counted, two with minor scuffs."
              rows={3}
            />
          </Field>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            Save evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EvidenceGallery({
  evidence,
  bookingId,
  onAdded,
  canAdd = true,
}: {
  evidence: ConditionEvidence[];
  bookingId: string;
  onAdded: () => void;
  canAdd?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {evidence.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center">
          <CameraIcon className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No condition photos yet</p>
          <p className="text-xs text-muted-foreground">Record the items at pickup and at delivery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {evidence.map((item) => (
            <a
              key={item.evidenceId}
              href={item.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-lg border bg-card"
            >
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                {VIDEO.test(item.imageUrl) || item.mediaType === "video" ? (
                  <video src={item.imageUrl} className="size-full object-cover" muted />
                ) : item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1 p-2">
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="outline" className="font-normal">
                    {item.stage === "DELIVERY" ? "Delivery" : "Pickup"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{dateTime(item.createdAt)}</span>
                </div>
                {item.description && <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
              </div>
            </a>
          ))}
        </div>
      )}
      {canAdd && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add condition photos
        </Button>
      )}
      <EvidenceDialog bookingId={bookingId} open={open} onOpenChange={setOpen} onSaved={onAdded} />
    </div>
  );
}
