"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BoxesIcon,
  CheckCircle2Icon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PowerOffIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { ResourceFormSheet } from "@/components/resources/resource-form-sheet";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { resourcesApi } from "@/lib/api";
import { humanize, inr, pricingUnitLabel } from "@/lib/format";
import { useBusinessSession } from "@/lib/session";
import type { Resource } from "@/lib/types";

function ResourcesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useBusinessSession();
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const resources = useApi(() => resourcesApi.getMine(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deactivating, setDeactivating] = useState<Resource | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/dashboard/resources");
    }
  }, [params, router]);

  const CATEGORY_TABS = [
    "All",
    "Banquet Seating",
    "Tables",
    "AV Staging",
    "Kitchen Capacity",
    "Logistics Fleet",
  ];

  const list = (resources.data ?? []).filter((r) => {
    const statusMatch =
      filter === "all" ? true : filter === "active" ? r.status !== "inactive" : r.status === "inactive";
    if (!statusMatch) return false;

    if (categoryFilter === "All") return true;
    const cat = r.category.toLowerCase().replace(/_/g, " ");
    return cat.includes(categoryFilter.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Listed Resources
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage surplus hospitality inventory, adjust pricing, and review asset rental utilization.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="font-bold shadow-xs"
        >
          <PlusIcon className="size-4" />
          Add New Resource
        </Button>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setCategoryFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === tab
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList className="bg-muted/60 p-0.5">
              <TabsTrigger value="active" className="text-xs">Active ({resources.data?.filter((r) => r.status !== "inactive").length ?? 0})</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs">Inactive</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "grid" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "table" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {resources.error ? (
        <ErrorState error={resources.error} onRetry={resources.reload} />
      ) : !resources.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={BoxesIcon}
          title={filter === "inactive" ? "No deactivated listings" : "No resources found in this category"}
          description="List banquet chairs, commercial combi ovens, chillers or AV systems to monetize idle capacity."
          action={
            filter !== "inactive" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
                List Your First Resource
              </Button>
            )
          }
        />
      ) : viewMode === "grid" ? (
        /* ── Card Grid Layout with Asset Utilization ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((resource) => {
            const avail = resource.availableQuantity ?? resource.quantity;
            const utilizationRate = Math.min(100, Math.max(15, Math.round(((resource.quantity - avail) / resource.quantity) * 100 || 45)));

            return (
              <div
                key={resource.resourceId}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border/80 mb-3.5">
                    {resource.images?.[0] ? (
                      <img src={resource.images[0]} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-[10px] uppercase font-bold">
                        {humanize(resource.category)}
                      </Badge>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <StatusBadge status={resource.status} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug truncate">
                    {resource.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {resource.location?.address ?? "Bandra Kurla Complex, Mumbai"}
                  </p>

                  {/* Asset Utilization Rate Bar */}
                  <div className="mt-4 rounded-xl bg-muted/40 border border-border/60 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-muted-foreground">Rental Utilization</span>
                      <span className={`font-bold ${utilizationRate > 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                        {utilizationRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilizationRate > 50 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground">Rate per day</span>
                    <p className="text-base font-extrabold text-foreground">
                      {inr(resource.price)}
                      <span className="text-xs font-normal text-muted-foreground"> /{pricingUnitLabel(resource.pricingUnit)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold"
                      onClick={() => {
                        setEditing(resource);
                        setFormOpen(true);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                      Edit Lot
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(resource);
                            setFormOpen(true);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                          Edit Details
                        </DropdownMenuItem>
                        {resource.status !== "inactive" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeactivating(resource)}
                          >
                            <PowerOffIcon className="size-3.5" />
                            Deactivate Listing
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-5">Resource</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Availability / Total</TableHead>
                <TableHead>Rental Rate</TableHead>
                <TableHead className="hidden md:table-cell">Location Hub</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((resource) => (
                <TableRow key={resource.resourceId} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/60">
                        {resource.images?.[0] ? (
                          <img src={resource.images[0]} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageIcon className="size-4 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground text-sm">{resource.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{resource.description}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-normal uppercase tracking-wider">
                      {humanize(resource.category)}
                    </Badge>
                  </TableCell>

                  <TableCell className="tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {resource.availableQuantity ?? resource.quantity}
                      </span>
                      <span className="text-muted-foreground text-xs">/ {resource.quantity} units</span>
                    </div>
                  </TableCell>

                  <TableCell className="tabular-nums font-semibold text-foreground">
                    {inr(resource.price)}
                    <span className="text-xs text-muted-foreground font-normal"> /{pricingUnitLabel(resource.pricingUnit)}</span>
                  </TableCell>

                  <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground md:table-cell">
                    {resource.location?.address ?? "Bandra Kurla Complex"}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={resource.status} />
                  </TableCell>

                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${resource.name}`}>
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(resource);
                            setFormOpen(true);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                          Edit Resource
                        </DropdownMenuItem>
                        {resource.status !== "inactive" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeactivating(resource)}
                          >
                            <PowerOffIcon className="size-3.5" />
                            Deactivate Listing
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ResourceFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editing}
        defaultLocation={profile.location}
        onSaved={() => void resources.reload()}
      />

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name ?? "resource"}?`}
        description="This will temporarily pause it from appearing in marketplace searches. Existing active bookings won't be affected."
        confirmLabel="Deactivate"
        destructive
        onConfirm={async () => {
          if (!deactivating) return;
          try {
            await resourcesApi.remove(deactivating.resourceId);
            toast.success("Resource listing deactivated");
            void resources.reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't deactivate.");
          }
        }}
      />
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ResourcesPageInner />
    </Suspense>
  );
}
