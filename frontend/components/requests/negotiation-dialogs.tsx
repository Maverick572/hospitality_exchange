"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { requestsApi } from "@/lib/api";
import { inr } from "@/lib/format";

export type NegotiationTarget = {
  requestId: string;
  title: string;
  quantity: number;
  price: number;
};

export function CounterDialog({
  target,
  onOpenChange,
  onDone,
}: {
  target: NegotiationTarget | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setPrice(String(target.price));
    setQuantity(String(target.quantity));
    setMessage("");
    setError(null);
  }, [target]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await requestsApi.counter(target.requestId, {
        price: Number(price),
        quantity: Number(quantity),
        message,
      });
      toast.success("Counter-offer sent");
      onDone();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the counter-offer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Counter-offer</DialogTitle>
            <DialogDescription>
              {target?.title} · current offer {target ? `${target.quantity} for ${inr(target.price)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="co-price">Price (₹, total)</FieldLabel>
                <Input id="co-price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="co-qty">Quantity</FieldLabel>
                <Input id="co-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="co-msg">Message</FieldLabel>
              <Textarea
                id="co-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We can do 250 chairs for ₹5,500 including delivery."
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              Send counter-offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({
  target,
  onOpenChange,
  onDone,
}: {
  target: NegotiationTarget | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) setReason("");
  }, [target]);

  async function submit() {
    if (!target) return;
    setSaving(true);
    try {
      await requestsApi.reject(target.requestId, reason || undefined);
      toast.success("Request declined");
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't decline the request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline request?</DialogTitle>
          <DialogDescription>{target?.title}. The other side is notified with your reason.</DialogDescription>
        </DialogHeader>
        <Field className="py-2">
          <FieldLabel htmlFor="rj-reason">Reason (optional)</FieldLabel>
          <Textarea
            id="rj-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Already booked on those dates."
            rows={3}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={() => void submit()} disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
