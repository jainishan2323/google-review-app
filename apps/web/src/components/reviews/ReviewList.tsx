import Link from "next/link";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@repo/db";
import { resolveLabel } from "@repo/types";
import { buttonVariants } from "@/components/ui/button";
import { ReviewCard } from "@/components/ReviewCard";
import { getReviewsPage, type RatingFilter, type ReplyFilter } from "@/lib/active-reviews";
import type { ResolvedBusiness } from "@/lib/current-business";

const PAGE_SIZE = 20;

interface ReviewListProps {
  business: ResolvedBusiness;
  ratingFilter: RatingFilter;
  replyFilter: ReplyFilter;
  page: number;
}

// Async server component holding the per-filter query, so it can sit inside a Suspense
// boundary (keyed by the filter params) — the stat cards + filters stay put while only
// this list shows a skeleton during a filter change.
export async function ReviewList({
  business,
  ratingFilter,
  replyFilter,
  page: requestedPage,
}: ReviewListProps) {
  const [{ reviews, total, pendingCount, page, totalPages }, config] = await Promise.all([
    getReviewsPage(business, {
      ratingFilter,
      replyFilter,
      page: requestedPage,
      pageSize: PAGE_SIZE,
    }),
    prisma.formConfig.findUnique({
      where: { businessId: business.id },
      include: { categories: { include: { tags: true } } },
    }),
  ]);

  // Review.tags / negativeTags store tag IDENTITIES (ADR-0005) — resolve each to a
  // display label before rendering. Falls back to the raw id only if a tag was hard-
  // deleted out of band (we deactivate, so this shouldn't happen).
  const language = config?.defaultLanguage ?? "en";
  const labelById = new Map<string, string>();
  for (const cat of config?.categories ?? []) {
    for (const tag of cat.tags) {
      labelById.set(
        tag.id,
        resolveLabel(tag.labels, { default: language, authored: tag.authoredLanguage })
      );
    }
  }
  const labelFor = (id: string) => labelById.get(id) ?? id;

  const pageHref = (p: number) =>
    `/dashboard/reviews?rating=${ratingFilter}&reply=${replyFilter}&page=${p}`;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <Star className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground text-sm">No reviews to show.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-sm text-muted-foreground mb-4 text-center">
        Showing {total} review{total !== 1 ? "s" : ""}
        {pendingCount > 0 ? ` · ${pendingCount} awaiting reply` : ""} · sorted by newest
      </p>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            id={review.id}
            authorName={review.authorName}
            authorPhoto={review.authorPhoto}
            rating={review.rating}
            text={review.text}
            publishedAtIso={review.publishedAt.toISOString()}
            isReplied={review.isReplied}
            replyText={review.replyText}
            repliedAtIso={review.repliedAt ? review.repliedAt.toISOString() : null}
            tags={review.tags.map(labelFor)}
            negativeTags={review.negativeTags.map(labelFor)}
            unmappedInsights={review.unmappedInsights}
            businessName={business.name}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 pt-6 mt-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}>
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Link>
          ) : (
            <span className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 pointer-events-none opacity-40" })}>
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </span>
          )}

          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 pointer-events-none opacity-40" })}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
