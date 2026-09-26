"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  ClipboardListIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Page, PageHeader } from "@/components/page-header";
import { RequirementFormSheet } from "@/components/requirements/requirement-form-sheet";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { requirementsApi } from "@/lib/api";
import { humanize, inr, shortDate } from "@/lib/format";
import { toLocalInput } from "@/lib/pricing";
import { useBusinessSession } from "@/lib/session";
import type { Requirement } from "@/lib/types";

function searchHref(requirement: Requirement) {
  const params = new URLSearchParams({ q: requirement.description, requirementId: requirement.requirementId });
  if (requirement.requiredDate) {
    const day = requirement.requiredDate.slice(0, 10);
    params.set("from", toLocalInput(new Date(`${day}T${requirement.startTime || "10:00"}`)));
    params.set("to", toLocalInput(new Date(`${day}T${requirement.endTime || "22:00"}`)));
  }
  return `/dashboard/search?${params.toString()}`;
}

function RequirementsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useBusinessSession();
  const requirements = useApi(requirementsApi.getMine);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [cancelling, setCancelling] = useState<Requirement | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/dashboard/requirements");
    }
  }, [params, router]);

  const list = (requirements.data ?? [])
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <Page>
      <PageHeader
        title="Requirements"
        description="Saved needs with dates, budget and delivery details. Find matches for any of them in one click."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Post a requirement
          </Button>
        }
      />

      {requirements.error ? (
        <ErrorState error={requirements.error} onRetry={requirements.reload} />
      ) : !requirements.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No requirements yet"
          description="Post what you need for an upcoming event. You can also just search the marketplace directly."
          action={
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Post a requirement
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/search">
                  <SearchIcon data-icon="inline-start" />
                  Search now
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((requirement) => {
            const active = !["cancelled", "fulfilled", "completed"].includes(requirement.status);
            return (
              <article
                key={requirement.requirementId}
                className="flex flex-col gap-3 rounded-[1.375rem] border border-border bg-muted p-1"
              >
                <div className="flex flex-1 flex-col gap-3 rounded-[1.125rem] border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 font-medium">{requirement.description}</p>
                    <StatusBadge status={requirement.status} className="shrink-0" />
                  </div>
                  {requirement.items?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {requirement.items.map((item) => (
                        <Badge key={`${item.name}-${item.category}`} variant="secondary" className="font-normal">
                          {item.name} × {item.quantity}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      {shortDate(requirement.requiredDate)}
                      {requirement.startTime ? ` · ${requirement.startTime}–${requirement.endTime}` : ""}
                    </span>
                    {requirement.location?.address && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="size-3.5" />
                        {requirement.location.address}
                      </span>
                    )}
                    {requirement.budget ? (
                      <span className="flex items-center gap-1">
                        <WalletIcon className="size-3.5" />
                        {inr(requirement.budget)}
                      </span>
                    ) : null}
                    {requirement.deliveryRequired && (
                      <span className="flex items-center gap-1">
                        <TruckIcon className="size-3.5" />
                        Delivery
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2">
                  {active && (
                    <Button size="sm" asChild>
                      <Link href={searchHref(requirement)}>
                        <SearchIcon data-icon="inline-start" />
                        Find matches
                      </Link>
                    </Button>
                  )}
                  {active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(requirement);
                        setFormOpen(true);
                      }}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                  )}
                  {active && (
                    <Button size="sm" variant="ghost" onClick={() => setCancelling(requirement)}>
                      <XIcon data-icon="inline-start" />
                      Cancel
                    </Button>
                  )}
                  {!active && <span className="px-1 text-xs text-muted-foreground">{humanize(requirement.status)}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RequirementFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        requirement={editing}
        defaultLocation={profile.location}
        onSaved={() => void requirements.reload()}
      />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancel this requirement?"
        description="Providers won't be matched to it any more. Requests you've already sent stay open."
        confirmLabel="Cancel requirement"
        destructive
        onConfirm={async () => {
          if (!cancelling) return;
          try {
            await requirementsApi.cancel(cancelling.requirementId);
            toast.success("Requirement cancelled");
            void requirements.reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't cancel.");
          }
        }}
      />
    </Page>
  );
}

export default function RequirementsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RequirementsPageInner />
    </Suspense>
  );
}
