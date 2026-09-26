"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  ClipboardListIcon,
  LockIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
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
import { usePerspective } from "@/lib/perspective";
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
  const { perspective, setPerspective } = usePerspective();
  const requirements = useApi(requirementsApi.getMine);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [cancelling, setCancelling] = useState<Requirement | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/dashboard/requirements");
    }
  }, [params, router]);

  const list = (requirements.data ?? [])
    .filter((r) => {
      if (filter === "all") return true;
      if (filter === "open") return ["open", "pending", "matching"].includes(r.status.toLowerCase());
      if (filter === "matched") return r.status.toLowerCase() === "matched";
      if (filter === "fulfilled") return ["fulfilled", "completed"].includes(r.status.toLowerCase());
      return r.status.toLowerCase() === filter;
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <Page>
      <PageHeader
        title="Requirements"
        description="Saved needs with dates, budget and delivery details. Find matches for any of them in one click."
        actions={
          perspective === "seeker" ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="cursor-pointer font-bold shadow-xs"
            >
              <PlusIcon data-icon="inline-start" />
              Post a requirement
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => toast.error("Switch to Seeker View to post event requirements.")}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-2xs cursor-not-allowed hover:bg-muted"
              title="Switch to Seeker View to post requirements"
            >
              <LockIcon className="size-3.5 text-muted-foreground" />
              <span>Post Requirement (Seeker Only)</span>
            </button>
          )
        }
      />

      {/* ── Provider Mode Alert Banner ── */}
      {perspective === "provider" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <ShieldAlertIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Provider View Active:</strong> Provider view manages and monetizes existing venue assets. Sourcing requirements can only be posted in <strong>Seeker View</strong>.
            </span>
          </div>
          <Button
            size="xs"
            onClick={() => {
              setPerspective("seeker");
              toast.success("Switched to Seeker View");
            }}
            className="shrink-0 text-xs font-semibold"
          >
            Switch to Seeker View
          </Button>
        </div>
      )}

      {/* ── Status Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {["all", "open", "matched", "fulfilled"].map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setFilter(statusKey)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === statusKey
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {statusKey.toUpperCase()}
          </button>
        ))}
      </div>

      {requirements.error ? (
        <ErrorState error={requirements.error} onRetry={requirements.reload} />
      ) : !requirements.data ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No requirements found"
          description="Post what you need for an upcoming event to get matched with surplus 5-star inventory."
          action={
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Post a requirement
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/smart-matches">
                  <SparklesIcon data-icon="inline-start" />
                  View Smart Matches
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((requirement) => {
            const active = !["cancelled", "fulfilled", "completed"].includes(requirement.status);
            return (
              <article
                key={requirement.requirementId}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-bold text-foreground text-base group-hover:text-primary transition-colors">
                      {requirement.description}
                    </h3>
                    <StatusBadge status={requirement.status} className="shrink-0" />
                  </div>

                  {requirement.items?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {requirement.items.map((item) => (
                        <Badge key={`${item.name}-${item.category}`} variant="secondary" className="font-semibold text-xs">
                          {item.name} × {item.quantity}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarIcon className="size-3.5 text-primary" />
                      {shortDate(requirement.requiredDate)}
                      {requirement.startTime ? ` · ${requirement.startTime}–${requirement.endTime}` : ""}
                    </span>
                    {requirement.location?.address && (
                      <span className="flex items-center gap-1.5 font-medium truncate max-w-xs">
                        <MapPinIcon className="size-3.5 text-primary" />
                        {requirement.location.address}
                      </span>
                    )}
                    {requirement.budget ? (
                      <span className="flex items-center gap-1.5 font-bold text-foreground">
                        <WalletIcon className="size-3.5 text-primary" />
                        {inr(requirement.budget)} Budget
                      </span>
                    ) : null}
                    {requirement.deliveryRequired && (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <TruckIcon className="size-3.5" />
                        Co-loading Delivery
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    {active && (
                      <Button size="sm" className="font-bold text-xs" asChild>
                        <Link href="/dashboard/smart-matches">
                          <SparklesIcon className="size-3.5" />
                          View Smart Matches
                        </Link>
                      </Button>
                    )}
                    {active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(requirement);
                          setFormOpen(true);
                        }}
                        className="text-xs"
                      >
                        <PencilIcon className="size-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {active && (
                    <Button size="sm" variant="ghost" onClick={() => setCancelling(requirement)} className="text-xs text-muted-foreground hover:text-destructive">
                      <XIcon className="size-3.5" />
                      Cancel
                    </Button>
                  )}
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
