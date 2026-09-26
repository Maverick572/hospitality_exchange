"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckIcon, HandshakeIcon, MessageSquareIcon, RepeatIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/page-header";
import {
  CounterDialog,
  RejectDialog,
  type NegotiationTarget,
} from "@/components/requests/negotiation-dialogs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
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
      toast.success("Request accepted, booking created", {
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
    <Page>
      <PageHeader
        title="Requests"
        description="Offers from businesses that want to rent your resources. Accepting one creates a booking."
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="open">Needs reply{openCount ? ` (${openCount})` : ""}</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Declined</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {requests.error ? (
        <ErrorState error={requests.error} onRetry={requests.reload} />
      ) : !requests.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={HandshakeIcon}
          title={filter === "open" ? "No offers waiting" : "Nothing here"}
          description="When someone requests one of your resources, it lands here and in your notifications."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/resources">Manage resources</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((request) => {
            const open = OPEN.has(request.status);
            const target = toTarget(request);
            return (
              <article key={request.requestId} className="rounded-[1.375rem] border border-border bg-muted p-1">
                <div className="flex flex-col gap-4 rounded-[1.125rem] border border-border bg-card p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{request.seeker?.businessName ?? "A business"}</p>
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-muted-foreground">{relativeTime(request.updatedAt ?? request.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm">
                      {request.requestedQuantity} × {request.resource?.name ?? "Resource"}
                    </p>
                    {request.message && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MessageSquareIcon className="mt-0.5 size-3.5 shrink-0" />
                        <span className="line-clamp-2">{request.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Offer</p>
                      <p className={request.counterPrice ? "text-sm tabular-nums text-muted-foreground line-through" : "text-lg font-semibold tabular-nums"}>
                        {inr(request.offeredPrice)}
                      </p>
                      {request.counterPrice ? (
                        <p className="flex items-center justify-end gap-1 text-lg font-semibold tabular-nums">
                          <RepeatIcon className="size-3.5 text-amber-500" />
                          {inr(request.counterPrice)}
                        </p>
                      ) : null}
                    </div>

                    {open ? (
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" onClick={() => void accept(request)} disabled={accepting === request.requestId}>
                          {accepting === request.requestId ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCountering(target)}>
                          <RepeatIcon data-icon="inline-start" />
                          Counter
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejecting(target)} aria-label="Decline">
                          <XIcon />
                        </Button>
                      </div>
                    ) : request.status === "accepted" && request.bookingId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/bookings/${request.bookingId}`}>
                          Booking
                          <ArrowRightIcon data-icon="inline-end" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CounterDialog target={countering} onOpenChange={(open) => !open && setCountering(null)} onDone={() => void requests.reload()} />
      <RejectDialog target={rejecting} onOpenChange={(open) => !open && setRejecting(null)} onDone={() => void requests.reload()} />
    </Page>
  );
}
