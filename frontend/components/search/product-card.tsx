"use client";

import Link from "next/link";
import {
  CheckIcon,
  CircleAlertIcon,
  ImageIcon,
  MapPinIcon,
  PlusIcon,
  SendIcon,
  StarIcon,
  TruckIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { humanize, inr, pricingUnitLabel } from "@/lib/format";
import type { SearchProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: SearchProduct;
  rank: number;
  inBundle: boolean;
  onRequest: () => void;
  onDelivery: () => void;
  onToggleBundle: () => void;
  onDetails: () => void;
  canFindDelivery: boolean;
};

export function ProductCard({
  product,
  rank,
  inBundle,
  onRequest,
  onDelivery,
  onToggleBundle,
  onDetails,
  canFindDelivery,
}: Props) {
  const requested = product.matchedItem.requestedQuantity;
  const enough = product.availableQuantity >= requested;
  const image = product.images?.[0];

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[1.375rem] border bg-muted p-1 transition-colors",
        inBundle ? "border-primary/60" : "border-border",
      )}
    >
      <div className="flex flex-1 flex-col rounded-[1.125rem] border border-border bg-card">
        <button type="button" onClick={onDetails} className="relative block text-left" aria-label={`View ${product.name}`}>
          <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-[1.125rem] bg-muted/60">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground/50" />
            )}
          </div>
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm">
            #{rank}
          </span>
        </button>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button type="button" onClick={onDetails} className="text-left">
                <h3 className="line-clamp-1 font-semibold hover:underline">{product.name}</h3>
              </button>
              <Link
                href={`/dashboard/providers/${product.provider.providerId}`}
                className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {product.provider.businessName}
                <StarIcon className="ml-1 size-3 fill-amber-400 text-amber-400" />
                {product.provider.totalRatings ? product.provider.rating.toFixed(1) : "New"}
              </Link>
            </div>
            <Badge variant="outline" className="shrink-0 font-normal">
              {humanize(product.category)}
            </Badge>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold tabular-nums">{inr(product.price)}</span>
            <span className="text-xs text-muted-foreground">{pricingUnitLabel(product.pricingUnit)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                enough
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {enough ? <CheckIcon className="size-3" /> : <CircleAlertIcon className="size-3" />}
              {product.availableQuantity} available
              {!enough && ` of ${requested}`}
            </span>
            {product.distanceKm !== null && product.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                <MapPinIcon className="size-3" />
                {product.distanceKm.toFixed(1)} km away
              </span>
            )}
            {!product.availableForRequestedPeriod && (
              <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive">
                Booked on your dates
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            <Button size="sm" onClick={onRequest}>
              <SendIcon data-icon="inline-start" />
              Send request
            </Button>
            <Button size="sm" variant={inBundle ? "secondary" : "outline"} onClick={onToggleBundle}>
              {inBundle ? <CheckIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
              {inBundle ? "In bundle" : "Bundle"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelivery}
              disabled={!canFindDelivery}
              title={canFindDelivery ? "Find a driver" : "Set your delivery location to find drivers"}
            >
              <TruckIcon data-icon="inline-start" />
              Delivery
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
