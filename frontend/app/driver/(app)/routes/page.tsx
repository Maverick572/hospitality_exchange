"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PencilIcon, PlusIcon, PowerOffIcon, RouteIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { RouteMeta, RoutePath } from "@/components/driver/route-card";
import { RouteFormSheet } from "@/components/driver/route-form-sheet";
import { RouteMatchesSheet } from "@/components/driver/route-matches-sheet";
import { Page, PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { routesApi } from "@/lib/api";
import { isoDate } from "@/lib/format";
import { useDriverSession } from "@/lib/session";
import type { DriverRoute } from "@/lib/types";

type Filter = "upcoming" | "past" | "inactive";

function RoutesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useDriverSession();
  const routes = useApi(routesApi.getMine);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DriverRoute | null>(null);
  const [deactivating, setDeactivating] = useState<DriverRoute | null>(null);
  const [viewing, setViewing] = useState<DriverRoute | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/driver/routes");
    }
  }, [params, router]);

  const today = isoDate();
  const list = (routes.data ?? [])
    .filter((r) => {
      if (filter === "inactive") return r.status === "inactive";
      if (r.status === "inactive") return false;
      return filter === "upcoming" ? r.travelDate >= today : r.travelDate < today;
    })
    .sort((a, b) =>
      filter === "past"
        ? b.travelDate.localeCompare(a.travelDate)
        : `${a.travelDate} ${a.departureTime}`.localeCompare(`${b.travelDate} ${b.departureTime}`),
    );

  return (
    <Page>
      <PageHeader
        title="My routes"
        description="Journeys you're making with spare capacity. Deliveries are matched to routes that pass close by."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Publish route
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="inactive">Deactivated</TabsTrigger>
        </TabsList>
      </Tabs>

      {routes.error ? (
        <ErrorState error={routes.error} onRetry={routes.reload} />
      ) : !routes.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title={filter === "upcoming" ? "No upcoming routes" : "Nothing here"}
          description="Publish a trip you're already taking, like a morning run from Thane to Nerul, and pick up deliveries along the way."
          action={
            filter === "upcoming" && (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Publish your first route
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.map((route) => (
            <article
              key={route.routeId}
              className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-foreground/20 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1 space-y-2.5">
                <RoutePath route={route} />
                <RouteMeta route={route} />
              </div>
              {route.status !== "inactive" && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button size="sm" onClick={() => setViewing(route)} className="font-semibold shadow-xs">
                    <SparklesIcon data-icon="inline-start" />
                    View Matches
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(route);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeactivating(route)}
                    aria-label="Deactivate route"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <PowerOffIcon className="size-4" />
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <RouteFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        route={editing}
        defaultCapacity={profile.capacity}
        onSaved={() => void routes.reload()}
      />
      {viewing && (
        <RouteMatchesSheet route={viewing} onOpenChange={(open) => !open && setViewing(null)} onAccepted={() => undefined} />
      )}
      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Deactivate this route?"
        description="It stops being matched with new deliveries. Deliveries you've already accepted aren't affected."
        confirmLabel="Deactivate"
        destructive
        onConfirm={async () => {
          if (!deactivating) return;
          try {
            await routesApi.remove(deactivating.routeId);
            toast.success("Route deactivated");
            void routes.reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't deactivate.");
          }
        }}
      />
    </Page>
  );
}

export default function DriverRoutesPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RoutesPageInner />
    </Suspense>
  );
}
