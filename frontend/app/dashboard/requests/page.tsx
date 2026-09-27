"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  HandshakeIcon,
  HotelIcon,
  MessageSquareIcon,
  RepeatIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  CounterDialog,
  RejectDialog,
  type NegotiationTarget,
} from "@/components/requests/negotiation-dialogs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { requestsApi } from "@/lib/api";
import { inr, relativeTime } from "@/lib/format";
import type { ResourceRequest } from "@/lib/types";

type Filter = "open" | "accepted" | "rejected" | "all";

const OPEN = new Set(["pending", "countered"]);

function toTarget(request: ResourceRequest): NegotiationTarget {
  return {
    requestId: request.requestId,
    title: `${request.resource?.name ?? "Resource"} for ${request.seeker?.businessName ?? "a business"}`,
    quantity: request.requestedQuantity,
    price: request.counterPrice ?? request.offeredPrice,
  };
}

export default function RequestsPage() {
  const router = useRouter();
  const requests = useApi(() => requestsApi.getProviderRequests());
  const [filter, setFilter] = useState<Filter>("open");
  const [countering, setCountering] = useState<NegotiationTarget | null>(null);
  const [rejecting, setRejecting] = useState<NegotiationTarget | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const all = (requests.data ?? []).slice().sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const list = all.filter((r) =>
    filter === "all" ? true : filter === "open" ? OPEN.has(r.status) : r.status === filter,
  );
  const openCount = all.filter((r) => OPEN.has(r.status)).length;

  async function accept(request: ResourceRequest) {
    setAccepting(request.requestId);
    try {
      const result = await requestsApi.accept(request.requestId);
      toast.success("Request accepted! Booking created & escrow initiated", {
        action: { label: "Open booking", onClick: () => router.push(`/dashboard/bookings/${result.bookingId}`) },
      });
      void requests.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept the request.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Incoming Offers & Negotiation
        </h1>
        <p className="text-sm text-muted-foreground">
          B2B rental proposals from verified Mumbai hotels and event companies. Accepting an offer locks terms and creates a protected escrow contract.
        </p>
      </div>



      {/* ── Tabs Filter ── */}
      <div className="flex items-center justify-between border-b pb-2">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList className="bg-muted/50 p-0.5">
            <TabsTrigger value="open" className="text-xs">
              Needs Reply {openCount > 0 && <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">{openCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs">Accepted</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">Declined</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All Proposals</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Proposals List ── */}
      {requests.error ? (
        <ErrorState error={requests.error} onRetry={requests.reload} />
      ) : !requests.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={HandshakeIcon}
          title={filter === "open" ? "No offers pending review" : "No requests found"}
          description="When other hotels or catering teams request your resources, proposals appear here for negotiation."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/resources">View My Listed Resources</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.map((request) => {
            const open = OPEN.has(request.status);
            const target = toTarget(request);

            return (
              <article
                key={request.requestId}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-foreground/20 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HotelIcon className="size-4" />
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      {request.seeker?.businessName ?? "Mumbai Hospitality Partner"}
                    </span>
                    <StatusBadge status={request.status} />
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      {relativeTime(request.updatedAt ?? request.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      {request.requestedQuantity} units
                    </span>
                    <span className="text-muted-foreground text-xs">of</span>
                    <span className="font-medium text-foreground text-sm">
                      {request.resource?.name ?? "Hospitality Resource"}
                    </span>
                  </div>

                  {request.message && (
                    <div className="mt-2 rounded-lg border-l-2 border-primary/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                      &ldquo;{request.message}&rdquo;
                    </div>
                  )}

                  {request.counterNotes && (
                    <div className="mt-2 rounded-lg border-l-2 border-amber-500/60 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-semibold">Counter terms:</span> {request.counterNotes}
                    </div>
                  )}
                </div>

                {/* Pricing & Negotiation Actions */}
                <div className="flex shrink-0 flex-col md:flex-row md:items-center gap-4 pt-3 border-t md:border-t-0 md:pt-0 border-border">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Proposed Amount
                    </span>
                    {request.counterPrice ? (
                      <div className="flex items-center gap-2 md:justify-end">
                        <span className="text-xs tabular-nums text-muted-foreground line-through">
                          {inr(request.offeredPrice)}
                        </span>
                        <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {inr(request.counterPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {inr(request.offeredPrice)}
                      </span>
                    )}
                  </div>

                  {open ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void accept(request)}
                        disabled={accepting === request.requestId}
                        className="font-semibold shadow-xs"
                      >
                        {accepting === request.requestId ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <CheckIcon data-icon="inline-start" />
                        )}
                        Accept & Lock
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs"
                      >
                        <Link
                          href={`/dashboard/conversations?id=${request.requestId}&resource=${encodeURIComponent(request.resource?.name ?? "Resource")}&amount=${request.counterPrice ?? request.offeredPrice}&partnerName=${encodeURIComponent(request.seeker?.businessName ?? "Seeker")}&partnerId=${encodeURIComponent(request.seeker?.userId ?? request.seeker?.businessName ?? "Seeker")}&category=${encodeURIComponent(request.resource?.category ?? "general")}`}
                        >
                          <MessageSquareIcon className="size-3 mr-1" />
                          Chat & Negotiate
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCountering(target)}
                        className="text-xs"
                      >
                        <RepeatIcon data-icon="inline-start" />
                        Counter
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setRejecting(target)}
                        title="Decline Offer"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ) : request.status === "accepted" && request.bookingId ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/bookings/${request.bookingId}`}>
                        Open Booking
                        <ArrowRightIcon className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CounterDialog
        target={countering}
        onOpenChange={(open) => !open && setCountering(null)}
        onDone={() => void requests.reload()}
      />
      <RejectDialog
        target={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        onDone={() => void requests.reload()}
      />
    </div>
  );
}
