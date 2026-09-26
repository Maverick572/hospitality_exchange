"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CameraIcon,
  MapPinIcon,
  PackageCheckIcon,
  PackageIcon,
  StarIcon,
  TruckIcon,
  WalletIcon,
} from "lucide-react";

import { StatusTimeline } from "@/components/bookings/booking-timeline";
import { ConfirmReceiptDialog, ReviewDialog } from "@/components/bookings/booking-dialogs";
import { EscrowCard } from "@/components/bookings/escrow-card";
import { EvidenceGallery } from "@/components/bookings/evidence-section";
import { Page } from "@/components/page-header";
import { DeliveryDialog, type DeliveryQuery } from "@/components/search/delivery-dialog";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/use-api";
import { bookingsApi, resourcesApi } from "@/lib/api";
import { BOOKING_STEPS } from "@/lib/constants";
import { dateTime, humanize, shortDate } from "@/lib/format";
import { useBusinessSession } from "@/lib/session";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useBusinessSession();
  const booking = useApi(() => bookingsApi.getById(id), [id]);
  // Names aren't embedded in the booking; resolve them best-effort.
  const resource = useApi(() => resourcesApi.getById(booking.data!.resourceId), [booking.data?.resourceId], {
    enabled: Boolean(booking.data?.resourceId),
  });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryQuery | null>(null);

  if (booking.error) {
    return (
      <Page>
        <ErrorState error={booking.error} onRetry={booking.reload} />
      </Page>
    );
  }
  if (!booking.data) return <LoadingState />;

  const b = booking.data;
  const isSeeker = b.seekerId === profile.userId;
  const isProvider = b.providerId === profile.userId;
  const resourceName = resource.data?.name ?? "Resource";
  const providerName =
    resource.data?.provider?.businessName ?? (isProvider ? profile.businessName : null) ?? "the provider";
  const inProgress = !["delivered", "completed", "cancelled"].includes(b.status);
  const canReview = isSeeker && ["delivered", "completed"].includes(b.status);
  const reload = () => void booking.reload();

  return (
    <Page>
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/bookings"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          All bookings
        </Link>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {b.quantity} × {resourceName}
              </h1>
              <StatusBadge status={b.status} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Booking #{b.bookingId.replace("booking_", "").slice(0, 8)} · created {dateTime(b.createdAt)} ·{" "}
              <Badge variant="secondary" className="font-normal">
                {isSeeker ? "You're renting" : isProvider ? "You're providing" : "Participant"}
              </Badge>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSeeker && inProgress && (
              <Button onClick={() => setReceiptOpen(true)}>
                <PackageCheckIcon data-icon="inline-start" />
                Confirm receipt
              </Button>
            )}
            {canReview && (
              <Button variant="outline" onClick={() => setReviewOpen(true)}>
                <StarIcon data-icon="inline-start" />
                Rate provider
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card px-2 py-4">
        <StatusTimeline steps={BOOKING_STEPS} current={b.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <ChartCard title="Details" icon={PackageIcon}>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Detail label="Resource">
                {resourceName}
                {resource.data?.category && (
                  <span className="text-muted-foreground"> · {humanize(resource.data.category)}</span>
                )}
              </Detail>
              <Detail label="Quantity">{b.quantity}</Detail>
              <Detail label="Provider">
                {isProvider ? (
                  "You"
                ) : (
                  <Link href={`/dashboard/providers/${b.providerId}`} className="hover:underline">
                    {providerName}
                  </Link>
                )}
              </Detail>
              <Detail label="Renter">{isSeeker ? "You" : "Business renter"}</Detail>
            </div>
            <Separator />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="flex gap-2.5">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <Detail label={`Pickup · ${shortDate(b.pickupDate)}`}>{b.pickupLocation?.address || "—"}</Detail>
              </div>
              <div className="flex gap-2.5">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <Detail label={`Delivery · ${shortDate(b.deliveryDate)}`}>{b.deliveryLocation?.address || "—"}</Detail>
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <TruckIcon className="size-4" />
                </span>
                <Detail label="Driver">{b.driverId ? "Assigned" : "Not assigned yet"}</Detail>
              </div>
              {!b.driverId && inProgress && b.pickupLocation?.latitude && b.deliveryLocation?.latitude && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDelivery({
                      title: resourceName,
                      pickupLocation: b.pickupLocation ?? {},
                      deliveryLocation: b.deliveryLocation ?? {},
                      requiredCapacity: b.quantity,
                      travelDate: b.deliveryDate?.slice(0, 10) ?? null,
                    })
                  }
                >
                  <TruckIcon data-icon="inline-start" />
                  Find a driver
                </Button>
              )}
            </div>
          </ChartCard>

          <ChartCard title="Condition evidence" icon={CameraIcon}>
            <div className="p-4">
              <EvidenceGallery
                evidence={b.evidence ?? []}
                bookingId={b.bookingId}
                onAdded={reload}
                canAdd={b.status !== "completed" && b.status !== "cancelled"}
              />
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Payment" icon={WalletIcon} className="h-fit">
          <EscrowCard booking={b} isSeeker={isSeeker} onChanged={reload} />
        </ChartCard>
      </div>

      <ConfirmReceiptDialog bookingId={b.bookingId} open={receiptOpen} onOpenChange={setReceiptOpen} onDone={reload} />
      <ReviewDialog
        bookingId={b.bookingId}
        providerId={b.providerId}
        providerName={providerName}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onDone={reload}
      />
      {delivery && <DeliveryDialog query={delivery} onOpenChange={(open) => !open && setDelivery(null)} />}
    </Page>
  );
}

