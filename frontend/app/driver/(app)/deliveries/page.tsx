"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownIcon, CameraIcon, ChevronRightIcon, Navigation2Icon, TruckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StatusTimeline } from "@/components/bookings/booking-timeline";
import { EvidenceDialog } from "@/components/bookings/evidence-section";
import { Page, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDriverNavigation } from "@/contexts/driver-navigation-context";
import { useApi } from "@/hooks/use-api";
import { bookingsApi, deliveriesApi } from "@/lib/api";
import { DELIVERY_STEPS } from "@/lib/constants";
import { inr, shortDate } from "@/lib/format";
import type { Booking, DeliveryStatus } from "@/lib/types";

/** Map a booking's status onto the driver's four delivery steps. */
function deliveryStep(booking: Booking): DeliveryStatus {
  if (["delivered", "completed"].includes(booking.status)) return "delivered";
  if (booking.status === "in_transit") return "in_transit";
  if (booking.status === "picked_up") return "picked_up";
  return "pickup_pending";
}

const NEXT: Record<DeliveryStatus, { status: DeliveryStatus; label: string } | null> = {
  pickup_pending: { status: "picked_up", label: "Mark picked up" },
  picked_up: { status: "in_transit", label: "Start transit" },
  in_transit: { status: "delivered", label: "Mark delivered" },
  delivered: null,
};

export default function DeliveriesPage() {
  const router = useRouter();
  const { startNavigation } = useDriverNavigation();
  const [filter, setFilter] = useState<"active" | "completed">("active");
  const deliveries = useApi(() => bookingsApi.getMine({ role: "driver" }));
  const [updating, setUpdating] = useState<string | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<{ id: string; stage: "PICKUP" | "DELIVERY" } | null>(null);

  const list = (deliveries.data ?? [])
    .filter((b) => (filter === "completed" ? ["delivered", "completed"].includes(b.status) : !["delivered", "completed", "cancelled"].includes(b.status)))
    .sort((a, b) => (a.deliveryDate ?? "").localeCompare(b.deliveryDate ?? ""));

  // The delivery request id isn't on the booking yet; the booking id stands
  // in until the logistics module exposes /delivery-requests.
  async function advance(booking: Booking, status: DeliveryStatus) {
    setUpdating(booking.bookingId);
    try {
      await deliveriesApi.updateStatus(booking.bookingId, status);
      toast.success("Status updated");
      void deliveries.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the status.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Deliveries"
        description="Jobs you've accepted. Update the status as you go, and photograph the items at pickup and drop-off."
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {deliveries.error ? (
        <ErrorState error={deliveries.error} onRetry={deliveries.reload} />
      ) : !deliveries.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title={filter === "active" ? "No active deliveries" : "No completed deliveries yet"}
          description="Open one of your routes and view its matches to pick up a delivery."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/driver/routes">
                My routes
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((booking) => {
            const step = deliveryStep(booking);
            const next = NEXT[step];
            return (
              <article key={booking.bookingId} className="rounded-[1.375rem] border border-border bg-muted p-1">
                <div className="flex flex-col gap-4 rounded-[1.125rem] border border-border bg-card p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center pt-1.5">
                        <span className="size-2 rounded-full border-2 border-muted-foreground" />
                        <ArrowDownIcon className="my-0.5 size-3 text-muted-foreground" />
                        <span className="size-2 rounded-full bg-primary" />
                      </div>
                      <div className="text-sm">
                        <p>
                          {booking.pickupLocation?.address ?? "Pickup"}{" "}
                          <span className="text-xs text-muted-foreground">· {shortDate(booking.pickupDate)}</span>
                        </p>
                        <p className="mt-2 font-medium">
                          {booking.deliveryLocation?.address ?? "Drop-off"}{" "}
                          <span className="text-xs font-normal text-muted-foreground">· {shortDate(booking.deliveryDate)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Earnings</p>
                        <p className="font-semibold tabular-nums">{inr(booking.deliveryAmount)}</p>
                      </div>
                      <StatusBadge status={step} />
                    </div>
                  </div>

                  <StatusTimeline steps={DELIVERY_STEPS} current={step} />

                  <div className="flex flex-wrap gap-1.5">
                    {step !== "delivered" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          void startNavigation({
                            type: "booking",
                            id: booking.bookingId,
                            title: `Delivery #${booking.bookingId.replace("booking_", "").slice(0, 8)}`,
                            currentStatus: step,
                            earnings: booking.deliveryAmount,
                            waypoints: [
                              {
                                address: booking.pickupLocation?.address ?? "Pickup Location",
                                latitude: booking.pickupLocation?.latitude ?? 19.2183,
                                longitude: booking.pickupLocation?.longitude ?? 72.9781,
                                role: "pickup",
                              },
                              {
                                address: booking.deliveryLocation?.address ?? "Drop-off Location",
                                latitude: booking.deliveryLocation?.latitude ?? 19.0771,
                                longitude: booking.deliveryLocation?.longitude ?? 72.9986,
                                role: "delivery",
                              },
                            ],
                          });
                          router.push("/driver/navigation");
                        }}
                        className="gap-1 bg-emerald-600 font-semibold text-white shadow-xs hover:bg-emerald-700"
                      >
                        <Navigation2Icon className="size-3.5" />
                        Start GPS Navigation
                      </Button>
                    )}
                    {next && (
                      <Button
                        size="sm"
                        onClick={() => void advance(booking, next.status)}
                        disabled={updating === booking.bookingId}
                      >
                        {updating === booking.bookingId && <Spinner data-icon="inline-start" />}
                        {next.label}
                      </Button>
                    )}
                    {step !== "delivered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEvidenceFor({
                            id: booking.bookingId,
                            stage: step === "pickup_pending" ? "PICKUP" : "DELIVERY",
                          })
                        }
                      >
                        <CameraIcon data-icon="inline-start" />
                        {step === "pickup_pending" ? "Pickup photos" : "Delivery photos"}
                      </Button>
                    )}
                    <span className="self-center px-1 text-xs text-muted-foreground">
                      {booking.quantity} items · #{booking.bookingId.replace("booking_", "").slice(0, 8)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {evidenceFor && (
        <EvidenceDialog
          bookingId={evidenceFor.id}
          defaultStage={evidenceFor.stage}
          open
          onOpenChange={(open) => !open && setEvidenceFor(null)}
          onSaved={() => void deliveries.reload()}
        />
      )}
    </Page>
  );
}
