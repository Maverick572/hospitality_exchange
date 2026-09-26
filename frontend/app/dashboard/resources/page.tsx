"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BoxesIcon, ImageIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, PowerOffIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Page, PageHeader } from "@/components/page-header";
import { ResourceFormSheet } from "@/components/resources/resource-form-sheet";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
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
  const resources = useApi(() => resourcesApi.getMine(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deactivating, setDeactivating] = useState<Resource | null>(null);

  // ?new=1 (from dashboard quick actions) opens the form straight away.
  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/dashboard/resources");
    }
  }, [params, router]);

  const list = (resources.data ?? []).filter((r) =>
    filter === "all" ? true : filter === "active" ? r.status !== "inactive" : r.status === "inactive",
  );

  return (
    <Page>
      <PageHeader
        title="My resources"
        description="What you rent out. Active listings appear in marketplace search."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            List a resource
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Deactivated</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {resources.error ? (
        <ErrorState error={resources.error} onRetry={resources.reload} />
      ) : !resources.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={BoxesIcon}
          title={filter === "inactive" ? "Nothing deactivated" : "No resources listed yet"}
          description="List chairs, tables, AV gear or anything else that sits idle between events."
          action={
            filter !== "inactive" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon data-icon="inline-start" />
                List your first resource
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Resource</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((resource) => (
                <TableRow key={resource.resourceId}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {resource.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resource.images[0]} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageIcon className="size-4 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">{humanize(resource.category)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {resource.availableQuantity ?? resource.quantity}
                    <span className="text-muted-foreground"> / {resource.quantity}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {inr(resource.price)}
                    <span className="text-xs text-muted-foreground"> {pricingUnitLabel(resource.pricingUnit)}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                    {resource.location?.address ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={resource.status} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${resource.name}`}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(resource);
                            setFormOpen(true);
                          }}
                        >
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        {resource.status !== "inactive" && (
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeactivating(resource)}>
                            <PowerOffIcon />
                            Deactivate
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
        description="It stops appearing in search. Existing bookings aren't affected, and you can list it again later."
        confirmLabel="Deactivate"
        destructive
        onConfirm={async () => {
          if (!deactivating) return;
          try {
            await resourcesApi.remove(deactivating.resourceId);
            toast.success("Resource deactivated");
            void resources.reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't deactivate.");
          }
        }}
      />
    </Page>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ResourcesPageInner />
    </Suspense>
  );
}
