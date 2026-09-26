"use client";

import { useState } from "react";
import { LockKeyholeIcon, ShieldCheckIcon, UnlockIcon, WalletIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/use-api";
import { escrowApi } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";
import type { Booking } from "@/lib/types";

const ESCROW_COPY: Record<string, string> = {
  pending: "Waiting for the renter to pay into escrow.",
  funded: "Funds are secured and held until delivery is confirmed.",
  delivered: "Delivery confirmed. Ready to release to the provider and driver.",
  pending_release: "Delivery confirmed. Ready to release to the provider and driver.",
  released: "Paid out. The deposit went back to the renter, less any penalty.",
};

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

export function EscrowCard({
  booking,
  isSeeker,
  onChanged,
}: {
  booking: Booking;
  isSeeker: boolean;
  onChanged: () => void;
}) {
  const escrow = useApi(() => escrowApi.get(booking.escrowId as string), [booking.escrowId, booking.updatedAt], {
    enabled: Boolean(booking.escrowId),
  });
  const [paying, setPaying] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  const status = (escrow.data?.status ?? booking.escrowStatus ?? "pending").toLowerCase();
  const canPay = isSeeker && status === "pending" && Boolean(escrow.data);
  const deliveredBooking = ["delivered", "completed"].includes(booking.status);
  const canRelease = isSeeker && deliveredBooking && ["funded", "delivered", "pending_release"].includes(status);

  async function pay() {
    if (!escrow.data) return;
    setPaying(true);
    try {
      await escrowApi.fund(escrow.data.escrowId, `pay_demo_${Date.now()}`);
      toast.success("Payment successful", { description: `${inr(escrow.data.amount)} is now held in escrow.` });
      setPayOpen(false);
      await escrow.reload();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {status === "released" ? <UnlockIcon className="size-4" /> : <LockKeyholeIcon className="size-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">Escrow</p>
            <p className="text-xs text-muted-foreground">{ESCROW_COPY[status] ?? "Escrow status"}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-1">
        <Line label="Resources" value={inr(booking.resourceAmount)} />
        <Line label="Delivery" value={inr(booking.deliveryAmount)} />
        <Line label="Refundable deposit" value={inr(booking.depositAmount)} />
        <Separator />
        <Line label="Total" value={inr(booking.totalAmount)} strong />
      </div>

      {escrow.error ? (
        <ErrorState error={escrow.error} onRetry={escrow.reload} />
      ) : booking.escrowId && !escrow.data ? (
        <Skeleton className="h-8 w-full" />
      ) : escrow.data ? (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {escrow.data.fundedAt && <span>Funded {dateTime(escrow.data.fundedAt)}</span>}
          {escrow.data.releasedAt && (
            <span>
              Released {dateTime(escrow.data.releasedAt)}: {inr(escrow.data.providerAmount)} to provider
              {escrow.data.driverAmount ? `, ${inr(escrow.data.driverAmount)} to driver` : ""}
            </span>
          )}
        </div>
      ) : null}

      {canPay && (
        <Button onClick={() => setPayOpen(true)}>
          <WalletIcon data-icon="inline-start" />
          Pay {inr(escrow.data?.amount ?? booking.totalAmount)} into escrow
        </Button>
      )}
      {canRelease && (
        <Button onClick={() => setReleaseOpen(true)}>
          <UnlockIcon data-icon="inline-start" />
          Release payment
        </Button>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay into escrow</DialogTitle>
            <DialogDescription>
              This is a demo payment, so no card is charged. The money is held until you confirm delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/30 py-6">
            <ShieldCheckIcon className="size-6 text-emerald-500" />
            <p className="text-2xl font-semibold tabular-nums">{inr(escrow.data?.amount ?? booking.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">
              incl. {inr(booking.depositAmount)} refundable deposit
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void pay()} disabled={paying}>
              {paying && <Spinner data-icon="inline-start" />}
              Pay now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        title="Release payment?"
        description={`${inr(booking.resourceAmount)} goes to the provider${booking.deliveryAmount ? ` and ${inr(booking.deliveryAmount)} to the driver` : ""}. Your ${inr(booking.depositAmount)} deposit comes back to you. This can't be undone.`}
        confirmLabel="Release"
        onConfirm={async () => {
          if (!escrow.data) return;
          try {
            await escrowApi.release(escrow.data.escrowId);
            toast.success("Payment released");
            await escrow.reload();
            onChanged();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't release the payment.");
          }
        }}
      />
    </div>
  );
}
