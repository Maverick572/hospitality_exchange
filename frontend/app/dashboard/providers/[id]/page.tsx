"use client";

import { use } from "react";
import { MessageSquareQuoteIcon, StarIcon } from "lucide-react";

import { Page, PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApi } from "@/hooks/use-api";
import { reviewsApi } from "@/lib/api";
import { initials, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={cn("size-3.5", star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
    </span>
  );
}

export default function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const summary = useApi(() => reviewsApi.getForUser(id), [id]);

  const reviews = (summary.data?.reviews ?? [])
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const reviewerName = reviews[0]?.reviewerName;

  // Share of each star value, for the breakdown bars.
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, share: reviews.length ? count / reviews.length : 0 };
  });

  return (
    <Page className="max-w-4xl">
      <PageHeader title="Provider reviews" description="What other businesses said after renting from this provider." />

      {summary.error ? (
        <ErrorState error={summary.error} onRetry={summary.reload} />
      ) : !summary.data ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <div className="grid gap-4 rounded-[1.375rem] border border-border bg-muted p-1 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col items-center justify-center gap-1 rounded-[1.125rem] border border-border bg-card p-6">
              <p className="text-5xl font-semibold tabular-nums">
                {summary.data.totalRatings ? summary.data.rating.toFixed(1) : "—"}
              </p>
              <Stars rating={summary.data.rating} />
              <p className="text-xs text-muted-foreground">
                {summary.data.totalRatings} {summary.data.totalRatings === 1 ? "rating" : "ratings"}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-1.5 px-4 py-3">
              {breakdown.map((row) => (
                <div key={row.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 tabular-nums text-muted-foreground">{row.star}</span>
                  <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${row.share * 100}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquareQuoteIcon}
              title="No reviews yet"
              description="Reviews appear after completed bookings."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li key={review.reviewId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs font-semibold">{initials(review.reviewerName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{review.reviewerName ?? reviewerName ?? "A business"}</p>
                        <Stars rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{shortDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Page>
  );
}
