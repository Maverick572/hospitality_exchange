"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownUpIcon,
  PackageSearchIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { LocationField } from "@/components/location-field";
import { Page, PageHeader } from "@/components/page-header";
import { DeliveryDialog, type DeliveryQuery } from "@/components/search/delivery-dialog";
import { ProductCard } from "@/components/search/product-card";
import { ProductSheet } from "@/components/search/product-sheet";
import { RequestDialog, type RequestTarget } from "@/components/search/request-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { requestsApi, seekerApi } from "@/lib/api";
import { humanize, inr } from "@/lib/format";
import { estimateCost, localInputToIso, toLocalInput } from "@/lib/pricing";
import { useBusinessSession } from "@/lib/session";
import type { GeoLocation, SearchProduct, SearchResult } from "@/lib/types";

type SortKey = "match" | "price" | "distance" | "rating";

const EXAMPLES = [
  "Need 100 banquet chairs and 10 round tables in Vashi tomorrow evening",
  "Looking for 2 projectors and a PA system for a conference on Saturday",
  "20 chafing dishes and 200 dinner plates for a wedding buffet",
];

function defaultWindow() {
  const from = new Date();
  from.setDate(from.getDate() + 1);
  from.setHours(10, 0, 0, 0);
  const to = new Date(from);
  to.setHours(22, 0, 0, 0);
  return { from: toLocalInput(from), to: toLocalInput(to) };
}

function sortProducts(products: SearchProduct[], key: SortKey) {
  if (key === "match") return products;
  const copy = products.slice();
  if (key === "price") copy.sort((a, b) => a.price - b.price);
  if (key === "distance") copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  if (key === "rating") copy.sort((a, b) => (b.provider.rating ?? 0) - (a.provider.rating ?? 0));
  return copy;
}

function SearchPageInner() {
  const params = useSearchParams();
  const { profile } = useBusinessSession();
  const [initialWindow] = useState(defaultWindow);

  const [description, setDescription] = useState(params.get("q") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? initialWindow.from);
  const [to, setTo] = useState(params.get("to") ?? initialWindow.to);
  const [location, setLocation] = useState<GeoLocation | null>(profile.location ?? null);
  const requirementId = params.get("requirementId");

  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [searching, setSearching] = useState(false);
  const [sort, setSort] = useState<SortKey>("match");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [requestTarget, setRequestTarget] = useState<RequestTarget | null>(null);
  const [deliveryQuery, setDeliveryQuery] = useState<DeliveryQuery | null>(null);
  const [detail, setDetail] = useState<SearchProduct | null>(null);
  const [bundle, setBundle] = useState<Record<string, SearchProduct>>({});
  const [sendingBundle, setSendingBundle] = useState(false);

  const rentalWindow = useMemo(
    () => ({ from: localInputToIso(from), to: localInputToIso(to) }),
    [from, to],
  );

  async function runSearch(text = description) {
    const query = text.trim();
    if (!query) return;
    setSearching(true);
    setError(null);
    try {
      setResult(
        await seekerApi.search({
          description: query,
          fromTimestamp: rentalWindow.from,
          toTimestamp: rentalWindow.to,
          location,
        }),
      );
      setBundle({});
    } catch (err) {
      setError(err);
    } finally {
      setSearching(false);
    }
  }

  // Arriving from the navbar search (?q=…) runs the search straight away.
  const autoRan = useRef(false);
  useEffect(() => {
    const q = params.get("q");
    if (q && !autoRan.current) {
      autoRan.current = true;
      setDescription(q);
      void runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const products = useMemo(() => {
    const list = (result?.products ?? []).filter(
      (p) => !onlyAvailable || (p.availableForRequestedPeriod && p.availableQuantity >= p.matchedItem.requestedQuantity),
    );
    return sortProducts(list, sort);
  }, [result, sort, onlyAvailable]);

  // Group by the parsed item each product answers, so "chairs" and "tables"
  // read as separate shortlists.
  const groups = useMemo(() => {
    const map = new Map<string, SearchProduct[]>();
    for (const product of products) {
      const key = `${product.matchedItem.name} × ${product.matchedItem.requestedQuantity}`;
      map.set(key, [...(map.get(key) ?? []), product]);
    }
    return Array.from(map.entries());
  }, [products]);

  function toTarget(product: SearchProduct): RequestTarget {
    return {
      resourceId: product.resourceId,
      providerId: product.provider.providerId,
      providerName: product.provider.businessName,
      name: product.name,
      price: product.price,
      pricingUnit: product.pricingUnit,
      availableQuantity: product.availableQuantity,
      requestedQuantity: product.matchedItem.requestedQuantity,
    };
  }

  function bundleQty(product: SearchProduct) {
    return Math.max(1, Math.min(product.matchedItem.requestedQuantity, product.availableQuantity || 1));
  }

  const bundleItems = Object.values(bundle);
  const bundleTotal = bundleItems.reduce(
    (sum, p) => sum + estimateCost(p.price, p.pricingUnit, bundleQty(p), rentalWindow),
    0,
  );

  async function sendBundle() {
    setSendingBundle(true);
    let sent = 0;
    const failures: string[] = [];
    for (const product of bundleItems) {
      const qty = bundleQty(product);
      try {
        await requestsApi.create({
          requirementId,
          providerId: product.provider.providerId,
          resourceId: product.resourceId,
          requestedQuantity: qty,
          offeredPrice: Math.round(estimateCost(product.price, product.pricingUnit, qty, rentalWindow)),
          message: `Bundle request: ${qty} × ${product.name} for ${description.trim()}`,
        });
        sent += 1;
      } catch (err) {
        failures.push(`${product.name}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }
    setSendingBundle(false);
    if (sent) toast.success(`Sent ${sent} request${sent === 1 ? "" : "s"}`);
    if (failures.length) toast.error("Some requests failed", { description: failures.join("\n") });
    if (!failures.length) setBundle({});
  }

  return (
    <Page className="pb-28">
      <PageHeader
        title="Find resources"
        description="Describe what you need the way you'd say it. We'll pull out the items and rank nearby providers."
      />

      {/* ── Search bar ── */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
        className="overflow-hidden rounded-[1.375rem] border border-border bg-muted p-1"
      >
        <div className="rounded-[1.125rem] border border-border bg-card p-4">
          <div className="relative">
            <SparklesIcon className="pointer-events-none absolute left-3 top-3 size-4 text-primary" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runSearch();
                }
              }}
              placeholder={EXAMPLES[0]}
              rows={2}
              className="min-h-16 resize-none border-none bg-transparent pl-9 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
              aria-label="What do you need?"
            />
          </div>
          {!result && !description && (
            <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDescription(example)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3 px-3 pb-2 pt-3 md:grid-cols-[1fr_1fr_1.6fr_auto] md:items-end">
          <Field>
            <FieldLabel htmlFor="from" className="text-xs text-muted-foreground">From</FieldLabel>
            <Input id="from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="to" className="text-xs text-muted-foreground">To</FieldLabel>
            <Input id="to" type="datetime-local" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="where" className="text-xs text-muted-foreground">Deliver to</FieldLabel>
            <LocationField id="where" value={location} onChange={setLocation} />
          </Field>
          <Button type="submit" size="lg" disabled={searching || !description.trim()} className="md:mb-5">
            {searching ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
            Search
          </Button>
        </div>
      </form>

      {/* ── Results ── */}
      {searching && !result ? (
        <LoadingState label="Reading your request and ranking providers…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void runSearch()} />
      ) : !result ? (
        <EmptyState
          icon={PackageSearchIcon}
          title="Start with what you need"
          description="Quantities, dates and places in your sentence are all picked up. The more specific, the better the ranking."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-sm text-muted-foreground">We understood:</span>
              {result.parsedItems.map((item) => (
                <Badge key={`${item.name}-${item.category}`} variant="secondary" className="gap-1 font-normal">
                  <TagIcon className="size-3" />
                  {humanize(item.category)}: {item.name} × {item.quantity}
                  {item.metric !== "units" ? ` ${item.metric}` : ""}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
                Fully available only
              </label>
              <div className="flex items-center gap-1.5">
                <ArrowDownUpIcon className="size-3.5 text-muted-foreground" />
                <NativeSelect size="sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort results">
                  <NativeSelectOption value="match">Best match</NativeSelectOption>
                  <NativeSelectOption value="price">Lowest price</NativeSelectOption>
                  <NativeSelectOption value="distance">Nearest</NativeSelectOption>
                  <NativeSelectOption value="rating">Top rated</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearchIcon}
              title="No matching listings yet"
              description={
                onlyAvailable
                  ? "Nothing is fully available for those dates. Turn off the filter to see partial matches."
                  : "No provider has listed these items yet. Try different wording, or save it as a requirement so you can come back to it."
              }
            />
          ) : (
            groups.map(([label, items]) => (
              <section key={label} className="flex flex-col gap-3">
                {groups.length > 1 && (
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {label} <span className="font-normal">· {items.length} options</span>
                  </h2>
                )}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((product, index) => (
                    <ProductCard
                      key={`${product.resourceId}-${label}`}
                      product={product}
                      rank={index + 1}
                      inBundle={Boolean(bundle[product.resourceId])}
                      canFindDelivery={Boolean(location)}
                      onDetails={() => setDetail(product)}
                      onRequest={() => setRequestTarget(toTarget(product))}
                      onToggleBundle={() =>
                        setBundle((current) => {
                          const next = { ...current };
                          if (next[product.resourceId]) delete next[product.resourceId];
                          else next[product.resourceId] = product;
                          return next;
                        })
                      }
                      onDelivery={() =>
                        location &&
                        setDeliveryQuery({
                          title: product.name,
                          pickupLocation: product.location ?? product.provider.location ?? {},
                          deliveryLocation: location,
                          requiredCapacity: bundleQty(product),
                          travelDate: rentalWindow.from?.slice(0, 10),
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* ── Bundle tray ── */}
      {bundleItems.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-popover p-3 shadow-xl sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Bundle · {bundleItems.length} item{bundleItems.length === 1 ? "" : "s"} from{" "}
                {new Set(bundleItems.map((p) => p.provider.providerId)).size} provider(s)
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {bundleItems.map((p) => (
                  <Badge key={p.resourceId} variant="outline" className="gap-1 font-normal">
                    {bundleQty(p)} × {p.name}
                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() =>
                        setBundle((current) => {
                          const next = { ...current };
                          delete next[p.resourceId];
                          return next;
                        })
                      }
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Estimated total</p>
                <p className="font-semibold tabular-nums">{inr(bundleTotal)}</p>
              </div>
              <Button onClick={() => void sendBundle()} disabled={sendingBundle}>
                {sendingBundle ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                Send all requests
              </Button>
            </div>
          </div>
        </div>
      )}

      <RequestDialog
        target={requestTarget}
        window={rentalWindow}
        requirementId={requirementId}
        onOpenChange={(open) => !open && setRequestTarget(null)}
      />
      {deliveryQuery && (
        <DeliveryDialog query={deliveryQuery} onOpenChange={(open) => !open && setDeliveryQuery(null)} />
      )}
      <ProductSheet
        product={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onRequest={(product) => {
          setDetail(null);
          setRequestTarget(toTarget(product));
        }}
      />
    </Page>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SearchPageInner />
    </Suspense>
  );
}
