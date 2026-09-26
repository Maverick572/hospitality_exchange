"use client";

import Link from "next/link";
import {
  CheckIcon,
  CircleAlertIcon,
  ImageIcon,
  MapPinIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
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
  const requested = product.matchedItem?.requestedQuantity ?? 1;
  const enough = product.availableQuantity >= requested;
  const image = product.images?.[0];
  const matchScore = product.matchScore ?? 92;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md",
        inBundle
          ? "border-primary ring-1 ring-primary shadow-sm"
          : "border-border hover:border-foreground/25",
      )}
    >
      {/* ── Image & Rank Overlay ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 cursor-pointer" onClick={onDetails}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur-md shadow-2xs">
            #{rank}
          </span>

          <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground backdrop-blur-md shadow-2xs">
            <SparklesIcon className="size-3" />
            {matchScore}% Match
          </span>
        </div>
      </div>

      {/* ── Card Content ── */}
      <div className="flex flex-1 flex-col justify-between p-4 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={onDetails}
                className="text-left font-semibold text-foreground text-sm line-clamp-1 hover:text-primary transition-colors"
              >
                {product.name}
              </button>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate max-w-[150px]">{product.provider.businessName}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-0.5 font-medium text-foreground">
                  <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                  {product.provider.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px] font-normal uppercase tracking-wider">
              {humanize(product.category)}
            </Badge>
          </div>

          {/* Pricing Row */}
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {inr(product.price)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              /{pricingUnitLabel(product.pricingUnit)}
            </span>
          </div>

          {/* Availability & Distance Pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium",
                enough
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
              )}
            >
              {enough ? <CheckIcon className="size-3" /> : <CircleAlertIcon className="size-3" />}
              {product.availableQuantity} available (need {requested})
            </span>

            {product.distanceKm !== null && product.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                <MapPinIcon className="size-3" />
                {product.distanceKm.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>

        {/* ── Actions Row ── */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={inBundle ? "default" : "outline"}
              size="xs"
              onClick={onToggleBundle}
              className="text-xs"
            >
              {inBundle ? (
                <>
                  <CheckIcon className="size-3" />
                  In Bundle
                </>
              ) : (
                <>
                  <PlusIcon className="size-3" />
                  Bundle
                </>
              )}
            </Button>

            {canFindDelivery && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onDelivery}
                title="Find route-matched delivery"
              >
                <TruckIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>

          <Button type="button" size="xs" onClick={onRequest} className="text-xs font-semibold">
            <SendIcon className="size-3" />
            Request Quote
          </Button>
        </div>
      </div>
    </article>
  );
}
