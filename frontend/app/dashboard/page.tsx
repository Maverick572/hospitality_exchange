"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  HandshakeIcon,
  HourglassIcon,
  IndianRupeeIcon,
  PackageCheckIcon,
  SearchIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";

import { Page } from "@/components/page-header";
import { PanelLink } from "@/components/panel-link";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatFrameCard } from "@/components/ui/stat-frame-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { bookingsApi, dashboardApi, notificationsApi } from "@/lib/api";
import { firstName, inr, relativeTime, shortDate } from "@/lib/format";
import { useBusinessSession } from "@/lib/session";

const QUICK_ACTIONS = [
  {
    href: "/dashboard/search",
    icon: SearchIcon,
    title: "Find resources",
    description: "Describe what you need in plain words",
  },
  {
    href: "/dashboard/resources?new=1",
    icon: BoxesIcon,
    title: "List a resource",
    description: "Earn from equipment sitting idle",
  },
  {
    href: "/dashboard/requirements?new=1",
    icon: ClipboardListIcon,
    title: "Post a requirement",
    description: "Save a need with budget and dates",
  },
  {
    href: "/dashboard/requests",
    icon: HandshakeIcon,
    title: "Review requests",
    description: "Accept, counter or decline offers",
  },
];

export default function DashboardHome() {
  const { profile } = useBusinessSession();
  const stats = useApi(dashboardApi.getUserDashboard);
  const bookings = useApi(() => bookingsApi.getMine());
  const notifications = useApi(notificationsApi.getAll);

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const recentBookings = (bookings.data ?? [])
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  return (
    <Page>
      {/* ── Welcome header ── */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName(profile.name)}!
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
            Here&apos;s what&apos;s moving at {profile.businessName || "your business"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1.5 text-sm font-semibold text-muted-foreground/80">Today, {today}</span>
          <Button asChild>
            <Link href="/dashboard/search">
              <SparklesIcon data-icon="inline-start" />
              Find resources
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : !stats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[118px] rounded-[1.375rem]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatFrameCard
            label="Active bookings"
            value={stats.data.activeBookings.toLocaleString("en-IN")}
            subValue={`${stats.data.completedBookings} completed so far`}
            icon={CalendarCheckIcon}
          />
          <StatFrameCard
            label="Pending requests"
            value={stats.data.pendingRequests.toLocaleString("en-IN")}
            subValue="Waiting on your reply"
            icon={HourglassIcon}
          />
          <StatFrameCard
            label="Total earnings"
            value={inr(stats.data.totalEarnings)}
            subValue={`${stats.data.activeResources} resources listed`}
            icon={IndianRupeeIcon}
          />
          <StatFrameCard
            label="Pending payments"
            value={inr(stats.data.pendingPayments)}
            subValue="Held in escrow"
            icon={WalletIcon}
          />
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <action.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-semibold">
                {action.title}
                <ArrowRightIcon className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* ── Recent bookings + activity ── */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Recent bookings" icon={PackageCheckIcon} action={<PanelLink href="/dashboard/bookings" />}>
          {bookings.error ? (
            <div className="p-4">
              <ErrorState error={bookings.error} onRetry={bookings.reload} />
            </div>
          ) : !bookings.data ? (
            <div className="p-4">
              <ListSkeleton rows={3} />
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <p className="text-sm font-medium">No bookings yet</p>
              <p className="text-xs text-muted-foreground">
                Bookings appear here once a request is accepted.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Booking</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-4 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.bookingId}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/dashboard/bookings/${booking.bookingId}`}
                        className="font-medium hover:underline"
                      >
                        {booking.quantity} items
                      </Link>
                      <div className="text-xs text-muted-foreground">{shortDate(booking.deliveryDate ?? booking.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.providerId === profile.userId ? "Providing" : "Renting"}
                    </TableCell>
                    <TableCell className="tabular-nums">{inr(booking.totalAmount)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <StatusBadge status={booking.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>

        <ChartCard title="Latest activity" icon={SparklesIcon} action={<PanelLink href="/dashboard/notifications" />}>
          {!notifications.data ? (
            <div className="p-4">
              <ListSkeleton rows={3} />
            </div>
          ) : notifications.data.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <p className="text-sm font-medium">Nothing new</p>
              <p className="text-xs text-muted-foreground">Requests, bookings and payments show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.data.slice(0, 5).map((n) => (
                <li key={n.notificationId} className="flex gap-3 px-4 py-3">
                  <span
                    className={n.read ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/30" : "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </Page>
  );
}
