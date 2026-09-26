"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheckIcon,
  ChevronRightIcon,
  PackageCheckIcon,
  SearchIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bookings & Escrow Contracts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active and fulfilled rental contracts with milestone escrow protection and delivery tracking.
          </p>
        </div>

        <Button asChild size="sm" className="font-semibold shadow-xs">
          <Link href="/dashboard/search">
            <SearchIcon data-icon="inline-start" />
            Find More Resources
          </Link>
        </Button>
      </div>

      {/* ── Filter Tabs & Role Selector ── */}
      <div className="flex flex-col justify-between gap-3 border-b pb-2 sm:flex-row sm:items-center">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList className="bg-muted/60 p-0.5">
            <TabsTrigger value="active" className="text-xs gap-1.5">
              <span>Active</span>
              <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                {(bookings.data ?? []).filter((b) => !["completed", "cancelled"].includes(b.status)).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs gap-1.5">
              <span>Upcoming</span>
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-foreground">
                {(bookings.data ?? []).filter((b) => UPCOMING.has(b.status)).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs gap-1.5">
              <span>Completed</span>
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-foreground">
                {(bookings.data ?? []).filter((b) => b.status === "completed").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs gap-1.5">
              <span>All Orders</span>
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-foreground">
                {(bookings.data ?? []).length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Perspective:</span>
          <NativeSelect
            size="sm"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            aria-label="Filter by role"
            className="text-xs"
          >
            <NativeSelectOption value="all">Renting & Providing</NativeSelectOption>
            <NativeSelectOption value="seeker">Renting (Seeker)</NativeSelectOption>
            <NativeSelectOption value="provider">Providing (Provider)</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* ── Table Content ── */}
      {bookings.error ? (
        <ErrorState error={bookings.error} onRetry={bookings.reload} />
      ) : !bookings.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarCheckIcon}
          title="No bookings in this view"
          description="Bookings are automatically generated once a rental proposal is accepted and terms are locked."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/search">Find Equipment</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-5">Contract ID</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead className="hidden md:table-cell">Delivery Schedule</TableHead>
                <TableHead>Contract Total</TableHead>
                <TableHead className="hidden sm:table-cell">Damage Deposit</TableHead>
                <TableHead>Logistics Driver</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((booking) => (
                <TableRow
                  key={booking.bookingId}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => router.push(`/dashboard/bookings/${booking.bookingId}`)}
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/dashboard/bookings/${booking.bookingId}`}
                      className="font-bold text-foreground hover:text-primary transition-colors text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{booking.bookingId.replace("booking_", "").replace("bk_", "").slice(0, 8)}
                    </Link>
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {booking.quantity} items requested
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                      {booking.providerId === profile.userId ? "Providing" : "Renting"}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {shortDate(booking.deliveryDate ?? booking.createdAt)}
                  </TableCell>

                  <TableCell className="tabular-nums font-semibold text-foreground">
                    {inr(booking.totalAmount)}
                  </TableCell>

                  <TableCell className="hidden tabular-nums text-xs text-muted-foreground sm:table-cell">
                    {inr(booking.depositAmount)}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {booking.driverId ? (
                      <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <TruckIcon className="size-3.5" />
                        Assigned
                      </span>
                    ) : (
                      "Self-pickup"
                    )}
                  </TableCell>

                  <TableCell className="pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge status={booking.status} />
                      <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
