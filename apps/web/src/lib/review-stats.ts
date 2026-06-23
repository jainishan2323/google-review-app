import { prisma } from "@repo/db";
import type { ResolvedBusiness } from "@/lib/current-business";

// All-time, business-wide review stats that back the top-of-page widget cards.
// Deliberately filter-INDEPENDENT (no rating/reply/time scoping) so the same numbers
// can be embedded anywhere (reviews page, home) as standalone widgets.
export interface ReviewStats {
  averageRating: number; // mean star rating across all reviews (0 when none)
  totalReviews: number; // all reviews for the business
  awaitingCount: number; // reviews with no reply yet
  repliedCount: number; // reviews that have a reply
  replyRate: number; // repliedCount / totalReviews, 0–1 (0 when none)
}

export async function getReviewStats(
  business: ResolvedBusiness
): Promise<ReviewStats> {
  const where = { businessId: business.id };

  const [agg, totalReviews, repliedCount] = await Promise.all([
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.review.count({ where }),
    prisma.review.count({ where: { ...where, isReplied: true } }),
  ]);

  return {
    averageRating: agg._avg.rating ?? 0,
    totalReviews,
    awaitingCount: totalReviews - repliedCount,
    repliedCount,
    replyRate: totalReviews === 0 ? 0 : repliedCount / totalReviews,
  };
}
