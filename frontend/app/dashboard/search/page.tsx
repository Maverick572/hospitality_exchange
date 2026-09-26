"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownUpIcon,
  CalendarIcon,
  CheckCircle2Icon,
  FilterIcon,
  MapPinIcon,
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
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { requestsApi, seekerApi } from "@/lib/api";
import { humanize, inr } from "@/lib/format";
import { estimateCost, localInputToIso, toLocalInput } from "@/lib/pricing";
import { useBusinessSession } from "@/lib/session";
import type { GeoLocation, SearchProduct, SearchResult } from "@/lib/types";

type SortKey = "match" | "price" | "distance" | "rating";

const EXAMPLES = [
  "100 luxury banquet chairs and 10 round tables in BKC tomorrow",
  "2 Christie 4K laser projectors and PA sound system for a conference",
  "20 stainless steel chafing dishes and combi oven for a wedding reception",
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
      const res = await seekerApi.search({
        description: query,
        fromTimestamp: rentalWindow.from,
        toTimestamp: rentalWindow.to,
        location,
      });
      setResult(res);
      setBundle({});
    } catch (err) {
      setError(err);
    } finally {
      setSearching(false);
    }
  }

  // Auto-run if query param provided
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
      (p) => !onlyAvailable || (p.availableForRequestedPeriod && p.availableQuantity >= (p.matchedItem?.requestedQuantity ?? 1)),
    );
    return sortProducts(list, sort);
  }, [result, sort, onlyAvailable]);

  // Group by item name
  const groups = useMemo(() => {
    const map = new Map<string, SearchProduct[]>();
    for (const product of products) {
      const key = product.matchedItem
        ? `${product.matchedItem.name} × ${product.matchedItem.requestedQuantity}`
        : product.name;
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
      requestedQuantity: product.matchedItem?.requestedQuantity ?? 1,
    };
  }

  function bundleQty(product: SearchProduct) {
    const requested = product.matchedItem?.requestedQuantity ?? 1;
    return Math.max(1, Math.min(requested, product.availableQuantity || 1));
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
    if (sent) toast.success(`Sent ${sent} rental request${sent === 1 ? "" : "s"}`);
    if (failures.length) toast.error("Some requests failed", { description: failures.join("\n") });
    if (!failures.length) setBundle({});
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Find Resources
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Natural language AI search across Mumbai B2B hospitality inventory with CP-SAT multi-factor ranking.
        </p>
      </div>

      {/* ── Search Form Card ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all focus-within:border-primary/40 focus-within:shadow-md"
      >
        <div className="relative flex flex-col gap-2">
          <div className="relative">
            <SparklesIcon className="pointer-events-none absolute left-3.5 top-3.5 size-4.5 text-primary" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runSearch();
                }
              }}
              placeholder="e.g. Need 100 luxury banquet chairs and 10 round tables in BKC tomorrow evening..."
              rows={2}
              className="w-full resize-none rounded-xl border border-border/80 bg-background/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Try asking:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setDescription(example);
                  void runSearch(example);
                }}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Filter controls row */}
        <div className="mt-4 grid gap-3 border-t border-border pt-3.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Start Date & Time
            </label>
            <Input
              id="from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              End Date & Time
            </label>
            <Input
              id="to"
              type="datetime-local"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="where" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Delivery Venue / Area
            </label>
            <LocationField id="where" value={location} onChange={setLocation} />
          </div>

          <Button type="submit" size="default" disabled={searching || !description.trim()} className="font-semibold h-9">
            {searching ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
            Search Matching
          </Button>
        </div>
      </form>

      {/* ── Search Results Area ── */}
      {searching && !result ? (
        <LoadingState label="Running LLM parser and querying CP-SAT ranking engine..." />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void runSearch()} />
      ) : !result ? (
        <EmptyState
          icon={PackageSearchIcon}
          title="Ready to search hospitality resources"
          description="Type what you need in natural language or pick one of the sample presets above to see matched inventory."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Extracted Query Breakdown & Sort Controls */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">AI Extracted Items:</span>
              {result.parsedItems.map((item) => (
                <Badge key={`${item.name}-${item.category}`} variant="secondary" className="gap-1 font-medium text-xs">
                  <TagIcon className="size-3 text-primary" />
                  {item.name} × {item.quantity} {item.metric !== "units" ? item.metric : ""}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
                Fully in-stock only
              </label>

              <div className="flex items-center gap-1.5">
                <ArrowDownUpIcon className="size-3.5 text-muted-foreground" />
                <NativeSelect
                  size="sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort results"
                  className="text-xs"
                >
                  <NativeSelectOption value="match">Highest Match Score</NativeSelectOption>
                  <NativeSelectOption value="price">Lowest Unit Price</NativeSelectOption>
                  <NativeSelectOption value="distance">Nearest Distance</NativeSelectOption>
                  <NativeSelectOption value="rating">Top Provider Rating</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearchIcon}
              title="No exact matches found"
              description="Try adjusting your rental dates, or uncheck the fully in-stock filter."
            />
          ) : (
            groups.map(([label, items]) => (
              <section key={label} className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    {label}
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    {items.length} verified listings
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      {/* ── Sticky Multi-Item Bundle Drawer ── */}
      {bundleItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-2xl px-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-2xs">
                {bundleItems.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Multi-Item Bundle Selection
                </span>
                <span className="text-xs text-muted-foreground">
                  Est. Total: <span className="font-bold text-foreground tabular-nums">{inr(bundleTotal)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="xs" onClick={() => setBundle({})}>
                Clear
              </Button>
              <Button size="sm" onClick={() => void sendBundle()} disabled={sendingBundle} className="font-semibold">
                {sendingBundle ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                Send Bundle Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <RequestDialog
        target={requestTarget}
        window={rentalWindow}
        requirementId={requirementId}
        onOpenChange={(open) => !open && setRequestTarget(null)}
      />

      {deliveryQuery && (
        <DeliveryDialog
          query={deliveryQuery}
          onOpenChange={(open) => !open && setDeliveryQuery(null)}
        />
      )}

      <ProductSheet
        product={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onRequest={(p) => {
          setDetail(null);
          setRequestTarget(toTarget(p));
        }}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading search console..." />}>
      <SearchPageInner />
    </Suspense>
  );
}
