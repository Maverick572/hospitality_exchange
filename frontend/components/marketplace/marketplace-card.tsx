"use client";

import { ArrowRightIcon, LockIcon, MapPinIcon, MessageSquareIcon, StarIcon, TruckIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/lib/types";

type MarketplaceCardProps = {
  resource: Resource;
  perspective?: "seeker" | "provider";
  onRequestBooking: (resource: Resource) => void;
};

export function MarketplaceCard({
  resource,
  perspective,
  onRequestBooking,
}: MarketplaceCardProps) {
  const imageUrl =
    resource.images && resource.images.length > 0
      ? resource.images[0]
      : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80";

  const providerName = resource.provider?.businessName || "Taj Horizon Hotel";
  const providerRating = resource.provider?.rating ?? 4.9;
  const reviewCount = resource.provider?.reviewCount ?? 112;
  const locationText = resource.location?.address || "Bandra West, Mumbai";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all group">
      <div>
        {/* Thumbnail with overlay badges */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={resource.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-foreground shadow-xs">
              {resource.category.replace(/_/g, " ")}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-foreground shadow-xs">
            <StarIcon className="size-3 text-amber-500 fill-amber-500" />
            <span>{providerRating.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {resource.name}
          </h3>

          <p className="mt-1 text-xs font-semibold text-muted-foreground flex items-center gap-1 truncate">
            <span>{providerName}</span>
          </p>

          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
            <MapPinIcon className="size-3 text-primary shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 flex items-center gap-1 font-semibold">
              <TruckIcon className="size-3" />
              Pickup & Delivery Available
            </Badge>
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing and Action */}
      <div className="border-t border-border p-4 sm:p-5 flex items-center justify-between bg-muted/20">
        <div>
          <span className="text-xs text-muted-foreground">Available: {resource.quantity} units</span>
          <div className="text-base font-extrabold text-foreground">
            ₹{resource.price.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-muted-foreground">/{resource.pricingUnit.replace(/per_/g, "")}</span>
          </div>
        </div>

        {perspective === "provider" ? (
          <button
            type="button"
            onClick={() => toast.error("Switch to Seeker View to match with demand or book resources.")}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs cursor-not-allowed hover:bg-muted"
            title="Switch to Seeker View to match resources"
          >
            <LockIcon className="size-3.5 text-muted-foreground" />
            <span>Match Demand (Seeker Only)</span>
          </button>
        ) : (
          <Button
            size="sm"
            className="font-bold shadow-xs text-xs cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onRequestBooking(resource)}
          >
            <MessageSquareIcon className="size-3.5" />
            <span>Proceed to Book</span>
          </Button>
        )}
      </div>
    </div>
  );
}
