"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { bookingsApi, reviewsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ConfirmReceiptDialog({
  bookingId,
  open,
  onOpenChange,
  onDone,
}: {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [received, setReceived] = useState(true);
  const [conditionConfirmed, setConditionConfirmed] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await bookingsApi.confirmReceipt(bookingId, { received, conditionConfirmed, notes: notes || undefined });
      toast.success("Receipt confirmed", { description: "You can now release the payment." });
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't confirm receipt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resources received?</DialogTitle>
          <DialogDescription>Confirming moves the booking to delivered so the escrow can be released.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-2">
          <label className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
            <Checkbox checked={received} onCheckedChange={(value) => setReceived(value === true)} />
            Everything received
          </label>
          <label className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
            <Checkbox checked={conditionConfirmed} onCheckedChange={(value) => setConditionConfirmed(value === true)} />
            Condition confirmed
          </label>
          <Field>
            <FieldLabel htmlFor="cr-notes">Notes</FieldLabel>
            <Textarea
              id="cr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional. Mention anything missing or damaged."
              rows={3}
            />
          </Field>
          {(!received || !conditionConfirmed) && (
            <Alert>
              <AlertDescription>
                Add condition photos before confirming so there&apos;s a record of the problem.
              </AlertDescription>
            </Alert>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not yet
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            Confirm receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          className="rounded-md p-0.5 transition-transform hover:scale-110"
        >
          <StarIcon
            className={cn(
              "size-7",
              star <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewDialog({
  bookingId,
  providerId,
  providerName,
  open,
  onOpenChange,
  onDone,
}: {
  bookingId: string;
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function submit() {
    if (!rating) {
      setError("Pick a star rating.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reviewsApi.create({ bookingId, providerId, rating, comment });
      toast.success("Thanks for the review");
      onDone();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit the review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {providerName}</DialogTitle>
          <DialogDescription>Ratings feed into how providers rank in search.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-2">
          <StarPicker value={rating} onChange={setRating} />
          <Field>
            <FieldLabel htmlFor="rv-comment">Comment</FieldLabel>
            <Textarea
              id="rv-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Resources arrived on time and were in good condition."
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
            Later
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
