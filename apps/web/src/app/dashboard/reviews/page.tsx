import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plug, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { ReviewsControls } from "@/components/ReviewsControls";
import { SyncReviewsButton } from "@/components/SyncReviewsButton";
import { ReviewStatsCards } from "@/components/reviews/ReviewStatsCards";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewListSkeleton } from "@/components/reviews/ReviewsSkeleton";
import { requireCurrentBusiness } from "@/lib/current-business";
import { getReviewStats } from "@/lib/review-stats";
import { getReviewsConnection } from "@/lib/active-reviews";
import type { RatingFilter, ReplyFilter } from "@/lib/active-reviews";

export const dynamic = "force-dynamic";

const ERROR_REASONS: Record<string, string> = {
  invalid_state: "The connection request expired. Please try connecting again.",
  forbidden: "You don't have access to connect this business.",
  no_locations: "No Google Business locations were found on that account.",
  exchange_failed: "Google rejected the authorization. Please try again.",
  access_denied: "You declined the permission. Connect again to grant access.",
};

interface PageProps {
  searchParams: Promise<{
    rating?: string;
    reply?: string;
    google?: string;
    loc?: string;
    reason?: string;
    more?: string;
    page?: string;
  }>;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const { rating: rawRating, reply: rawReply, google, loc, reason, more, page: rawPage } =
    await searchParams;

  const ratingFilter: RatingFilter =
    rawRating === "5" || rawRating === "4" || rawRating === "3" || rawRating === "lte2"
      ? rawRating
      : "all";
  const replyFilter: ReplyFilter =
    rawReply === "awaiting" || rawReply === "replied" ? rawReply : "all";
  const page = Number(rawPage) || 1;

  const business = await requireCurrentBusiness();

  // All-time stats (filter-independent) + connection status both render in the shell,
  // outside the per-filter Suspense, so toggling a filter only re-skeletons the list.
  const [stats, connection] = await Promise.all([
    getReviewStats(business),
    getReviewsConnection(business),
  ]);

  const { isConnected, isSampleData, needsInitialSync, syncedAt } = connection;
  const syncedLabel = syncedAt
    ? syncedAt.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Google Reviews</h1>
          <p className="text-sm mt-1 text-muted-foreground">{business.name}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Google connected
            </span>
          )}
          {isConnected && (
            <SyncReviewsButton syncedAt={syncedLabel} autoStart={needsInitialSync} />
          )}
          {isConnected && (
            <Link
              href="/api/google/connect"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Reconnect Google
            </Link>
          )}
        </div>
      </div>

      {/* Stat widgets — all-time, filter-independent. */}
      <div className="max-w-3xl mx-auto w-full">
        <ReviewStatsCards stats={stats} />
      </div>

      {/* Post-connect status (redirected from the OAuth callback). */}
      {google === "connected" && (
        <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-sm text-foreground">
            Connected to <strong>{loc ?? "your location"}</strong>.
            {more && Number(more) > 1
              ? ` We found ${more} locations and linked the first — tell us if you need a different one.`
              : ""}
          </p>
        </div>
      )}
      {google === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-foreground">
            {(reason && ERROR_REASONS[reason]) ?? "Couldn't connect Google. Please try again."}
          </p>
        </div>
      )}

      {/* Connect CTA when this business has no live Google grant yet. */}
      {!isConnected && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex-wrap">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              {isSampleData
                ? "Showing sample reviews — connect your Google Business Profile to bring in your own."
                : "Connect your Google Business Profile to see your reviews here."}
            </p>
          </div>
          <Link href="/api/google/connect" className={buttonVariants({ size: "sm", className: "gap-1.5" })}>
            <Plug className="h-3.5 w-3.5" />
            Connect Google
          </Link>
        </div>
      )}

      {/* Connected but never synced — the Sync button auto-fires (autoStart) to import
          in the background, so we render instantly instead of blocking on the import. */}
      {isConnected && needsInitialSync && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-foreground">
            Importing your Google reviews… this runs once and may take a few seconds.
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto w-full flex justify-center">
        <ReviewsControls currentRating={ratingFilter} currentReply={replyFilter} />
      </div>

      <Separator />

      {/* Only the list lives inside Suspense; the key re-suspends it (showing the
          skeleton) whenever a filter or page changes, leaving the cards + filters put. */}
      <div className="max-w-3xl mx-auto w-full">
        <Suspense
          key={`${ratingFilter}-${replyFilter}-${page}`}
          fallback={<ReviewListSkeleton />}
        >
          <ReviewList
            business={business}
            ratingFilter={ratingFilter}
            replyFilter={replyFilter}
            page={page}
          />
        </Suspense>
      </div>
    </main>
  );
}
