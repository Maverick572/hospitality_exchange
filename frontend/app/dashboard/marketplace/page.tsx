"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockIcon, PlusIcon, ShieldAlertIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { FilterBar } from "@/components/marketplace/filter-bar";
import { MarketplaceCard } from "@/components/marketplace/marketplace-card";
import { Button } from "@/components/ui/button";
import { resourcesApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { usePerspective } from "@/lib/perspective";
import { useBusinessSession } from "@/lib/session";
import type { Resource } from "@/lib/types";

export default function MarketplacePage() {
  const router = useRouter();
  const { profile } = useBusinessSession();
  const { perspective, setPerspective } = usePerspective();
  const resources = useApi(() => resourcesApi.getAll());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("");
  };

  const handleRequestBooking = (resource: Resource) => {
    if (perspective === "provider") {
      toast.error("Switch to Seeker View to match with demand or book resources.");
      return;
    }
    // Navigate to smart matches as in HACK-CELESTIAL
    router.push("/dashboard/smart-matches");
  };

  const filteredResources = (resources.data ?? []).filter((res) => {
    // Filter out current user's own resources from the marketplace (as in HACK-CELESTIAL)
    if (profile?.userId && (res.providerId === profile.userId || res.userId === profile.userId)) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      res.name.toLowerCase().includes(q) ||
      res.category.toLowerCase().includes(q) ||
      (res.location?.address && res.location.address.toLowerCase().includes(q));

    const matchesCategory = !categoryFilter || res.category === categoryFilter;
    const matchesLocation =
      !locationFilter ||
      (res.location?.address && res.location.address.toLowerCase().includes(locationFilter.toLowerCase()));

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
              <SparklesIcon className="size-3" />
              Live Capacity Feed
            </span>
            <span className="text-xs text-muted-foreground font-medium">Verified Mumbai Hospitality Assets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Resource Marketplace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rent surplus banquet furniture, AV staging, industrial kitchens & delivery fleets from 5-star partners
          </p>
        </div>

        {perspective === "seeker" ? (
          <Link href="/dashboard/requirements">
            <Button className="font-bold flex items-center gap-2 shadow-xs cursor-pointer">
              <PlusIcon className="size-4" />
              Post Custom Need
            </Button>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => toast.error("Switch to Seeker View to post custom requirements.")}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-2xs cursor-not-allowed hover:bg-muted"
            title="Switch to Seeker View to post custom requirements"
          >
            <LockIcon className="size-3.5 text-muted-foreground" />
            <span>Post Custom Need (Seeker Only)</span>
          </button>
        )}
      </div>

      {/* ── Provider Mode Alert Banner ── */}
      {perspective === "provider" && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <ShieldAlertIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Provider View Active:</strong> Sourcing and requesting equipment from the marketplace is a Seeker action. Switch to <strong>Seeker View</strong> to send booking requests or post custom needs.
            </span>
          </div>
          <Button
            size="xs"
            onClick={() => {
              setPerspective("seeker");
              toast.success("Switched to Seeker View");
            }}
            className="shrink-0 text-xs font-semibold cursor-pointer"
          >
            Switch to Seeker View
          </Button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        onClear={handleClearFilters}
      />

      {/* ── Resource Grid ── */}
      {filteredResources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-base font-semibold text-foreground">No resources match your filter criteria.</p>
          <p className="mt-1 text-xs text-muted-foreground">Try clearing filters or adjusting your search term.</p>
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4 font-semibold text-xs">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <MarketplaceCard
              key={res.resourceId}
              resource={res}
              perspective={perspective}
              onRequestBooking={handleRequestBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}
