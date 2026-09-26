"use client";

import Link from "next/link";
import { ImageIcon, MapPinIcon, SendIcon, StarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { humanize, inr, pricingUnitLabel, shortDate } from "@/lib/format";
import type { SearchProduct } from "@/lib/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** Resource detail view (section 5, GET /resources/{id}), built from the search row. */
export function ProductSheet({
  product,
  onOpenChange,
  onRequest,
}: {
  product: SearchProduct | null;
  onOpenChange: (open: boolean) => void;
  onRequest: (product: SearchProduct) => void;
}) {
  return (
    <Sheet open={Boolean(product)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {product && (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>{humanize(product.category)}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              {product.images?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {product.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg border object-cover" />
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed bg-muted/40">
                  <ImageIcon className="size-6 text-muted-foreground/50" />
                </div>
              )}

              {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

              <div className="rounded-xl border bg-card px-3">
                <Row label="Price">
                  {inr(product.price)} <span className="text-muted-foreground">{pricingUnitLabel(product.pricingUnit)}</span>
                </Row>
                <Separator />
                <Row label="Available">
                  {product.availableQuantity} of {product.quantity}
                </Row>
                <Separator />
                <Row label="Condition">{humanize(product.condition)}</Row>
                <Separator />
                <Row label="Location">
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="size-3.5 text-muted-foreground" />
                    {product.location?.address || product.provider.location?.address || "—"}
                  </span>
                </Row>
                {product.distanceKm !== null && (
                  <>
                    <Separator />
                    <Row label="Distance">{product.distanceKm.toFixed(1)} km</Row>
                  </>
                )}
              </div>

              {product.availability?.length ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium">Availability</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.availability.map((slot) => (
                      <Badge key={slot.date} variant="outline" className="font-normal">
                        {shortDate(slot.date)} · {slot.quantity}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">Provider</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{product.provider.businessName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                      {product.provider.totalRatings
                        ? `${product.provider.rating.toFixed(1)} · ${product.provider.totalRatings} ratings`
                        : "No ratings yet"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/providers/${product.provider.providerId}`}>Reviews</Link>
                  </Button>
                </div>
              </div>
            </div>

            <SheetFooter>
              <Button onClick={() => onRequest(product)}>
                <SendIcon data-icon="inline-start" />
                Send request
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
