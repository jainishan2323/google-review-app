import { StatCard } from "@/components/reviews/StatCard";
import type { ReviewStats } from "@/lib/review-stats";

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-sm tracking-tight" aria-hidden>
      <span className="text-yellow-400">{"★".repeat(rounded)}</span>
      <span className="text-muted-foreground/40">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

// The all-time review widgets. Presentational: takes a computed ReviewStats and renders
// — no fetching. Embed anywhere by calling getReviewStats(business) server-side and
// passing the result in. Gracefully shows an empty state when there are no reviews.
export function ReviewStatsCards({ stats }: { stats: ReviewStats }) {
  const hasReviews = stats.totalReviews > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        align="center"
        label="Average rating"
        value={hasReviews ? stats.averageRating.toFixed(1) : "—"}
        suffix={hasReviews ? "/5" : undefined}
        sub={
          hasReviews ? (
            <span className="flex items-center justify-center gap-2">
              <StarRow rating={stats.averageRating} />
              <span>across {stats.totalReviews} reviews</span>
            </span>
          ) : (
            "No reviews yet"
          )
        }
      />

      <StatCard
        align="center"
        label="Total reviews"
        value={stats.totalReviews}
        sub="all time"
      />

      <StatCard
        align="center"
        label="Awaiting reply"
        value={stats.awaitingCount}
        accent={stats.awaitingCount > 0 ? "amber" : "default"}
        sub={stats.awaitingCount > 0 ? "needs a response" : "all caught up"}
      />
    </div>
  );
}
