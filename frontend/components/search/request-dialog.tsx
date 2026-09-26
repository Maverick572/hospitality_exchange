"use client";

import { useEffect, useState } from "react";
import { SendIcon } from "lucide-react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { requestsApi } from "@/lib/api";
import { inr, pricingUnitLabel } from "@/lib/format";
import { estimateCost, type RentalWindow } from "@/lib/pricing";

export type RequestTarget = {
  resourceId: string;
  providerId: string;
  providerName: string;
  name: string;
  price: number;
  pricingUnit: string;
  availableQuantity: number;
  requestedQuantity?: number;
};

type Props = {
  target: RequestTarget | null;
  window: RentalWindow;
  requirementId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

/** "Send request / offer" to a provider for one resource. */
export function RequestDialog({ target, window, requirementId, onOpenChange, onSent }: Props) {
  const [quantity, setQuantity] = useState("1");
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!target) return;
    const qty = Math.max(
      1,
      Math.min(target.requestedQuantity ?? 1, target.availableQuantity || target.requestedQuantity || 1),
    );
    setQuantity(String(qty));
    setOffer(String(Math.round(estimateCost(target.price, target.pricingUnit, qty, window))));
    setMessage("");
    setError(null);
  }, [target, window]);

  if (!target) return null;

  const qty = Number(quantity) || 0;
  const listPrice = Math.round(estimateCost(target.price, target.pricingUnit, qty, window));
  const overStock = target.availableQuantity > 0 && qty > target.availableQuantity;

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    setSending(true);
    setError(null);
    try {
      await requestsApi.create({
        requirementId: requirementId ?? null,
        providerId: target.providerId,
        resourceId: target.resourceId,
        requestedQuantity: qty,
        offeredPrice: Number(offer),
        message,
      });
      toast.success(`Request sent to ${target.providerName}`, {
        description: "You'll get a notification when they reply.",
      });
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={send}>
          <DialogHeader>
            <DialogTitle>Request {target.name}</DialogTitle>
            <DialogDescription>
              From {target.providerName} · {inr(target.price)} {pricingUnitLabel(target.pricingUnit)}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="req-qty">Quantity</FieldLabel>
                <Input
                  id="req-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    const next = Number(e.target.value) || 0;
                    setOffer(String(Math.round(estimateCost(target.price, target.pricingUnit, next, window))));
                  }}
                  required
                />
                <FieldDescription className={overStock ? "text-amber-600 dark:text-amber-400" : undefined}>
                  {target.availableQuantity} available
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="req-offer">Your offer (₹, total)</FieldLabel>
                <Input
                  id="req-offer"
                  type="number"
                  min={1}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  required
                />
                <FieldDescription>List price {inr(listPrice)}</FieldDescription>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="req-message">Message</FieldLabel>
              <Textarea
                id="req-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Event details, delivery timing, anything the provider should know."
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
            <Button disabled={sending || qty < 1 || Number(offer) <= 0}>
              {sending ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
