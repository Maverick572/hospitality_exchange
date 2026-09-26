"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SparklesIcon } from "lucide-react";

import { FilterBar } from "@/components/marketplace/filter-bar";
import { MarketplaceCard } from "@/components/marketplace/marketplace-card";
import { Button } from "@/components/ui/button";
import { mockStore } from "@/lib/mock-store";
import type { Resource } from "@/lib/types";

export default function MarketplacePage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    // Load initial resources from mockStore or API
    setResources(mockStore.getResources());
  }, []);

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("");
  };

  const handleRequestBooking = (resource: Resource) => {
    // Direct to negotiations / booking request
    router.push(`/dashboard/requests?resourceId=${encodeURIComponent(resource.resourceId)}`);
  };

  const filteredResources = resources.filter((res) => {
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

        <Link href="/dashboard/requirements">
          <Button className="font-bold flex items-center gap-2 shadow-xs">
            <PlusIcon className="size-4" />
            Post Custom Need
          </Button>
        </Link>
      </div>

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
              onRequestBooking={handleRequestBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}
