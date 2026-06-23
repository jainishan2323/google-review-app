import { prisma } from "@repo/db";
import { fetchReviews, STAR_RATING_MAP } from "@/lib/google-business";
import { getFreshAccessToken, isLiveLinked } from "@/lib/google-token";

// Only the fields the sync needs — a ResolvedBusiness is structurally assignable.
type SyncableBusiness = { id: string; googleLocationId: string };

export interface SyncResult {
  synced: number; // reviews currently on the Google location (upserted)
  removed: number; // stored rows pruned because Google no longer returns them
  syncedAt: Date;
}

// Pull the full review history from Google into our `Review` rows so the dashboard
// reads fast from Postgres and we re-hit the API only on an explicit sync.
//
// Legal/ToS note: Google's API Terms permit caching review content, but require we
// keep it fresh and honor deletions — so this is an UPSERT-AND-PRUNE, not an append:
// reviews Google no longer returns (edited away / deleted by the reviewer) are removed,
// which also satisfies the GDPR "delete on request" expectation for reviewer name/photo.
// We only persist what the public listing already shows (name, photo URL, rating, text,
// dates, our own reply) — nothing hidden. See the API ToS discussion in the reviews docs.
export async function syncBusinessReviews(
  business: SyncableBusiness
): Promise<SyncResult> {
  if (!isLiveLinked(business.googleLocationId)) {
    throw new Error("not_connected");
  }

  const accessToken = await getFreshAccessToken(business.id);
  if (!accessToken) throw new Error("no_token");

  const live = await fetchReviews(accessToken, business.googleLocationId);

  // Upsert each live review by its stable Google id. We deliberately DON'T touch the
  // AI-enrichment fields (tags / negativeTags / unmappedInsights / analyzedAt) on
  // update, so a re-sync never wipes analysis already computed for that review.
  const seenIds: string[] = [];
  for (const r of live) {
    seenIds.push(r.reviewId);
    const data = {
      authorName: r.reviewer?.displayName ?? "Anonymous",
      authorPhoto: r.reviewer?.profilePhotoUrl ?? null,
      rating: STAR_RATING_MAP[r.starRating] ?? 0,
      text: r.comment ?? null,
      publishedAt: new Date(r.createTime),
      isReplied: !!r.reviewReply,
      replyText: r.reviewReply?.comment ?? null,
      repliedAt: r.reviewReply?.updateTime
        ? new Date(r.reviewReply.updateTime)
        : null,
    };
    await prisma.review.upsert({
      where: { googleReviewId: r.reviewId },
      create: { businessId: business.id, googleReviewId: r.reviewId, ...data },
      update: data,
    });
  }

  // Prune stored reviews this location no longer returns. The fetch threw on any API
  // error, so reaching here means the empty/short list is authoritative — safe to prune.
  const removed = await prisma.review.deleteMany({
    where: { businessId: business.id, googleReviewId: { notIn: seenIds } },
  });

  const syncedAt = new Date();
  await prisma.business.update({
    where: { id: business.id },
    data: { reviewsSyncedAt: syncedAt },
  });

  return { synced: live.length, removed: removed.count, syncedAt };
}
