"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon, CheckIcon, RepeatIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/page-header";
import { CounterDialog, RejectDialog, type NegotiationTarget } from "@/components/requests/negotiation-dialogs";
import { notificationHref } from "@/components/shell/notifications-menu";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { notificationsApi, requestsApi } from "@/lib/api";
import { dateTime, humanize, relativeTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Full notification list. A counter-offer notification carries the request
 * id, so the seeker can accept, counter or decline right here: there's no
 * seeker-side request list in the API.
 */
export function NotificationsPage({ kind }: { kind: "business" | "driver" }) {
  const router = useRouter();
  const notifications = useApi(notificationsApi.getAll);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [countering, setCountering] = useState<NegotiationTarget | null>(null);
  const [rejecting, setRejecting] = useState<NegotiationTarget | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const items = (notifications.data ?? []).filter((n) => filter === "all" || !n.read);
  const unread = (notifications.data ?? []).filter((n) => !n.read);

  function markLocal(ids: string[]) {
    notifications.setData((current) =>
      (current ?? []).map((n) => (ids.includes(n.notificationId) ? { ...n, read: true } : n)),
    );
  }

  async function markAllRead() {
    const ids = unread.map((n) => n.notificationId);
    markLocal(ids);
    await Promise.allSettled(ids.map((id) => notificationsApi.markRead(id)));
  }

  function open(n: AppNotification) {
    if (!n.read) {
      markLocal([n.notificationId]);
      void notificationsApi.markRead(n.notificationId).catch(() => undefined);
    }
    router.push(notificationHref(n, kind));
  }

  async function acceptCounter(n: AppNotification) {
    if (!n.referenceId) return;
    setBusy(n.notificationId);
    try {
      const result = await requestsApi.accept(n.referenceId);
      markLocal([n.notificationId]);
      toast.success("Counter-offer accepted, booking created");
      router.push(`/dashboard/bookings/${result.bookingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept the counter-offer.");
    } finally {
      setBusy(null);
    }
  }

  function negotiationTarget(n: AppNotification): NegotiationTarget {
    const match = n.message.match(/(\d+) items for ₹([\d.]+)/);
    return {
      requestId: n.referenceId ?? "",
      title: "Counter-offer",
      quantity: match ? Number(match[1]) : 1,
      price: match ? Number(match[2]) : 0,
    };
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Requests, negotiation, bookings, deliveries and payments."
        actions={
          unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
              <CheckCheckIcon data-icon="inline-start" />
              Mark all read
            </Button>
          )
        }
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread{unread.length ? ` (${unread.length})` : ""}</TabsTrigger>
        </TabsList>
      </Tabs>

      {notifications.error ? (
        <ErrorState error={notifications.error} onRetry={notifications.reload} />
      ) : !notifications.data ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={BellIcon} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {items.map((n, index) => {
            const isCounter = kind === "business" && n.type === "REQUEST_COUNTERED" && n.referenceId;
            return (
              <li
                key={n.notificationId}
                className={cn("flex gap-3 px-4 py-3.5", index > 0 && "border-t border-border", !n.read && "bg-primary/[0.03]")}
              >
                <span
                  className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-muted-foreground/25" : "bg-primary")}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => open(n)} className="w-full text-left">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground" title={dateTime(n.createdAt)}>
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">{humanize(n.type)}</p>
                  </button>
                  {isCounter && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => void acceptCounter(n)} disabled={busy === n.notificationId}>
                        {busy === n.notificationId ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                        Accept counter-offer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCountering(negotiationTarget(n))}>
                        <RepeatIcon data-icon="inline-start" />
                        Counter back
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(negotiationTarget(n))}>
                        <XIcon data-icon="inline-start" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CounterDialog target={countering} onOpenChange={(o) => !o && setCountering(null)} onDone={() => void notifications.reload()} />
      <RejectDialog target={rejecting} onOpenChange={(o) => !o && setRejecting(null)} onDone={() => void notifications.reload()} />
    </Page>
  );
}
