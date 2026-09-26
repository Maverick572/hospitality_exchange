"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheckIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { bookingsApi } from "@/lib/api";
import { inr, shortDate } from "@/lib/format";
import { useBusinessSession } from "@/lib/session";

type Filter = "active" | "upcoming" | "completed" | "all";
type Role = "all" | "seeker" | "provider";

const UPCOMING = new Set(["confirmed", "driver_assigned"]);

export default function BookingsPage() {
  const router = useRouter();
  const { profile } = useBusinessSession();
  const [filter, setFilter] = useState<Filter>("active");
  const [role, setRole] = useState<Role>("all");
  const bookings = useApi(
    () => bookingsApi.getMine({ role: role === "all" ? undefined : role }),
    [role],
  );

  const list = (bookings.data ?? [])
    .filter((b) => {
      if (filter === "all") return true;
      if (filter === "completed") return b.status === "completed";
      if (filter === "upcoming") return UPCOMING.has(b.status);
      return !["completed", "cancelled"].includes(b.status);
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <Page>
      <PageHeader
        title="Bookings"
        description="Everything you've rented or rented out, from confirmation to payout."
      />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <NativeSelect size="sm" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Filter by role">
          <NativeSelectOption value="all">Renting and providing</NativeSelectOption>
          <NativeSelectOption value="seeker">Only what I&apos;m renting</NativeSelectOption>
          <NativeSelectOption value="provider">Only what I&apos;m providing</NativeSelectOption>
        </NativeSelect>
      </div>

      {bookings.error ? (
        <ErrorState error={bookings.error} onRetry={bookings.reload} />
      ) : !bookings.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarCheckIcon}
          title="No bookings here"
          description="A booking is created when a provider accepts a request."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/search">Find resources</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Booking</TableHead>
                <TableHead>You are</TableHead>
                <TableHead className="hidden md:table-cell">Delivery date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden sm:table-cell">Deposit</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="pr-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((booking) => (
                <TableRow
                  key={booking.bookingId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/bookings/${booking.bookingId}`)}
                >
                  <TableCell className="pl-4">
                    <Link
                      href={`/dashboard/bookings/${booking.bookingId}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{booking.bookingId.replace("booking_", "").slice(0, 8)}
                    </Link>
                    <div className="text-xs text-muted-foreground">{booking.quantity} items</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {booking.providerId === profile.userId ? "Providing" : "Renting"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {shortDate(booking.deliveryDate)}
                  </TableCell>
                  <TableCell className="tabular-nums">{inr(booking.totalAmount)}</TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                    {inr(booking.depositAmount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{booking.driverId ? "Assigned" : "—"}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusBadge status={booking.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Page>
  );
}
