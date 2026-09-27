"use client";

import { SearchIcon, XIcon } from "lucide-react";
import categoriesData from "@/lib/categories.json";

export const MUMBAI_HUBS = [
  "Bandra West",
  "Bandra Kurla Complex",
  "Andheri East",
  "Vile Parle East",
  "Powai",
  "Goregaon East",
  "Worli",
  "Lower Parel",
  "Fort",
  "Colaba",
];

type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  locationFilter: string;
  onLocationChange: (val: string) => void;
  onClear: () => void;
};

export function FilterBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  onClear,
}: FilterBarProps) {
  const categories = categoriesData.categories || [];
  const hasActiveFilters = Boolean(searchQuery || categoryFilter || locationFilter);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search resources by item name, hotel venue, or Mumbai locality..."
          className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <option value="">All Mumbai Hubs ({MUMBAI_HUBS.length})</option>
          {MUMBAI_HUBS.map((hub) => (
            <option key={hub} value={hub}>
              {hub}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <XIcon className="size-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
