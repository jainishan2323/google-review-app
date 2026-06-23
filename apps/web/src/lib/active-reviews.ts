import { prisma, type Prisma } from "@repo/db";
import { type ReviewVM } from "@/lib/google-business";
import { isLiveLinked } from "@/lib/google-token";
import type { ResolvedBusiness } from "@/lib/current-business";

export type RatingFilter = "all" | "5" | "4" | "3" | "lte2";
export type ReplyFilter = "all" | "awaiting" | "replied";

export interface ReviewsPageQuery {
  replyFilter: ReplyFilter; // awaiting / replied / all
  ratingFilter: RatingFilter;
  page: number; // 1-based, requested (clamped to range internally)
  pageSize: number;
}

export interface ReviewsPage {
  reviews: ReviewVM[]; // only the rows for the current page
  total: number; // rows matching the filter (across all pages)
  pendingCount: number; // unreplied rows matching the filter
  page: number; // effective (clamped) page
  totalPages: number;
  isConnected: boolean;
  isSampleData: boolean;
  // connected but never synced yet — the page kicks a one-off client sync to import.
  needsInitialSync: boolean;
  syncedAt: Date | null;
}

// Build the Prisma filter once so the count, pending-count and page queries all agree.
function buildWhere(
  businessId: string,
  replyFilter: ReplyFilter,
  ratingFilter: RatingFilter
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { businessId };
  if (replyFilter === "awaiting") where.isReplied = false;
  else if (replyFilter === "replied") where.isReplied = true;
  if (ratingFilter === "lte2") where.rating = { lte: 2 };
  else if (ratingFilter !== "all") where.rating = Number(ratingFilter);
  return where;
}

const REVIEW_SELECT = {
  id: true,
  authorName: true,
  authorPhoto: true,
  rating: true,
  text: true,
  publishedAt: true,
  isReplied: true,
  replyText: true,
  repliedAt: true,
  tags: true,
  negativeTags: true,
  unmappedInsights: true,
} satisfies Prisma.ReviewSelect;

// Fast, DB-paginated read for the Reviews page: filtering + ordering + paging all run
// in Postgres (backed by the [businessId, publishedAt] index), so a render only ever
// loads one page of rows — no full-history scan, and no live Google call. Importing
// fresh reviews is a separate, explicit sync (the Sync button / one-off bootstrap).
export async function getReviewsPage(
  business: ResolvedBusiness,
  q: ReviewsPageQuery
): Promise<ReviewsPage> {
  const connected = isLiveLinked(business.googleLocationId);
  const where = buildWhere(business.id, q.replyFilter, q.ratingFilter);

  const biz = connected
    ? await prisma.business.findUnique({
        where: { id: business.id },
        select: { reviewsSyncedAt: true },
      })
    : null;

  const [total, pendingCount] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { ...where, isReplied: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(Math.max(1, q.page), totalPages);

  const rows = await prisma.review.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * q.pageSize,
    take: q.pageSize,
    select: REVIEW_SELECT,
  });

  return {
    reviews: rows.map((r) => ({ ...r })),
    total,
    pendingCount,
    page,
    totalPages,
    isConnected: connected,
    isSampleData: !connected,
    needsInitialSync: connected && !biz?.reviewsSyncedAt,
    syncedAt: biz?.reviewsSyncedAt ?? null,
  };
}

export interface ReviewsConnection {
  isConnected: boolean;
  isSampleData: boolean;
  needsInitialSync: boolean;
  syncedAt: Date | null;
}

// Connection/sync status only (no filtered review query) — used by the page shell so
// the connected pill, Sync button and banners render outside the per-filter Suspense.
export async function getReviewsConnection(
  business: ResolvedBusiness
): Promise<ReviewsConnection> {
  const connected = isLiveLinked(business.googleLocationId);
  const biz = connected
    ? await prisma.business.findUnique({
        where: { id: business.id },
        select: { reviewsSyncedAt: true },
      })
    : null;
  return {
    isConnected: connected,
    isSampleData: !connected,
    needsInitialSync: connected && !biz?.reviewsSyncedAt,
    syncedAt: biz?.reviewsSyncedAt ?? null,
  };
}

// Lightweight connection status (no review fetch) for callers that just need it.
export async function getGoogleConnection(business: ResolvedBusiness): Promise<{
  isConnected: boolean;
  locationId: string | null;
}> {
  if (!isLiveLinked(business.googleLocationId)) {
    return { isConnected: false, locationId: null };
  }
  const biz = await prisma.business.findUnique({
    where: { id: business.id },
    select: { refreshToken: true, accessToken: true },
  });
  return {
    isConnected: !!(biz?.refreshToken || biz?.accessToken),
    locationId: business.googleLocationId,
  };
}
