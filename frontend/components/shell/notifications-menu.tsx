"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationsApi } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

const POLL_MS = 5_000;

/** Where clicking a notification should land, by its type and reference. */
export function notificationHref(n: AppNotification, kind: "business" | "driver") {
  const type = n.type.toUpperCase();
  if (kind === "driver") {
    if (type.includes("ROUTE") || type.includes("MATCH")) return "/driver/routes";
    return "/driver/deliveries";
  }
  if (
    type.includes("NEGOTIATION") ||
    type.includes("REQUEST") ||
    type.includes("COUNTER") ||
    (n.referenceId && (n.referenceId.startsWith("request_") || n.referenceId.startsWith("req_")))
  ) {
    const reqQuery = n.referenceId ? `?id=${n.referenceId}` : "";
    return `/dashboard/conversations${reqQuery}`;
  }
  if (n.referenceId?.startsWith("booking_")) return `/dashboard/bookings/${n.referenceId}`;
  if (type.includes("BOOKING") || type.includes("ESCROW") || type.includes("PAYMENT") || type.includes("DELIVERY")) {
    return "/dashboard/bookings";
  }
  return "/dashboard/notifications";
}

export function NotificationsMenu({ kind }: { kind: "business" | "driver" }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setItems(list);

      // Check for incoming new unread notifications to alert the user
      for (const n of list) {
        if (!n.read && !seenIdsRef.current.has(n.notificationId)) {
          if (!isInitialRef.current) {
            toast(n.title, {
              description: n.message,
              action: {
                label: "View",
                onClick: () => {
                  void open(n);
                },
              },
            });
          }
          seenIdsRef.current.add(n.notificationId);
        }
      }
      isInitialRef.current = false;
    } catch {
      // The bell is secondary; a failed poll just keeps the last list.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);

    // Cross-tab and local broadcast listeners for instant notification delivery
    const handleCustom = (e: Event) => {
      void load();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "hrex_last_notif") {
        void load();
      }
    };

    window.addEventListener("hrex_notification_received", handleCustom);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("hrex_notification_received", handleCustom);
      window.removeEventListener("storage", handleStorage);
    };
  }, [load]);

  const unread = items.filter((n) => !n.read);
  const allHref = kind === "driver" ? "/driver/notifications" : "/dashboard/notifications";

  async function open(n: AppNotification) {
    if (!n.read) {
      setItems((current) => current.map((item) => (item.notificationId === n.notificationId ? { ...item, read: true } : item)));
      void notificationsApi.markRead(n.notificationId).catch(() => undefined);
    }
    router.push(notificationHref(n, kind));
  }

  return (
    <DropdownMenu onOpenChange={(isOpen) => isOpen && void load()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label={unread.length ? `${unread.length} unread notifications` : "Notifications"}
        >
          <BellIcon className="size-4" />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 flex min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-3.5 text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1.5">
        <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
          <span className="text-sm font-semibold">Notifications</span>
          {unread.length > 0 && (
            <span className="text-xs text-muted-foreground">{unread.length} unread</span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
            <CheckCheckIcon className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">Requests, bookings and payments show up here.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.slice(0, 8).map((n) => (
              <DropdownMenuItem
                key={n.notificationId}
                className="items-start gap-2.5 px-2 py-2"
                onSelect={() => void open(n)}
              >
                <span
                  className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-xs">
          <Link href={allHref}>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
