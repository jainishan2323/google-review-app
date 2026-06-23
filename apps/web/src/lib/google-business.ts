// Google Business Profile API wrapper
// Docs: https://developers.google.com/my-business/reference/rest

// Reviews/replies still live on the legacy v4 host; account + location discovery
// moved to the split v1 hosts.
const REVIEWS_API_BASE = "https://mybusiness.googleapis.com/v4";
const ACCOUNT_MGMT_API_BASE =
  "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_API_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

export interface GmbAccount {
  name: string; // e.g. "accounts/123"
  accountName?: string;
  type?: string;
}

export interface GmbLocation {
  name: string; // e.g. "locations/456"
  title?: string;
}

export interface GmbReview {
  name: string; // e.g. "accounts/123/locations/456/reviews/abc"
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const STAR_RATING_MAP: Record<GmbReview["starRating"], number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

// List the Google Business accounts the signed-in user can manage.
export async function listAccounts(accessToken: string): Promise<GmbAccount[]> {
  const res = await fetch(`${ACCOUNT_MGMT_API_BASE}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.accounts as GmbAccount[]) ?? [];
}

// List the locations under a given account name (e.g. "accounts/123").
export async function listLocations(
  accessToken: string,
  accountName: string
): Promise<GmbLocation[]> {
  const url = `${BUSINESS_INFO_API_BASE}/${accountName}/locations?readMask=name,title&pageSize=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.locations as GmbLocation[]) ?? [];
}

// The v4 reviews endpoint caps a page at 50 and returns a `nextPageToken`. We walk
// every page so the dashboard shows the full history, not just the latest 50. A hard
// page cap is a safety valve against an unexpected loop on very large accounts.
const REVIEWS_PAGE_SIZE = 50;
const MAX_REVIEW_PAGES = 100; // up to ~5,000 reviews

export async function fetchReviews(
  accessToken: string,
  locationName: string
): Promise<GmbReview[]> {
  const all: GmbReview[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const url = new URL(`${REVIEWS_API_BASE}/${locationName}/reviews`);
    url.searchParams.set("pageSize", String(REVIEWS_PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Google API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    if (Array.isArray(data.reviews)) all.push(...(data.reviews as GmbReview[]));
    pageToken = data.nextPageToken;
  } while (pageToken && ++pages < MAX_REVIEW_PAGES);

  return all;
}

export async function postReply(
  accessToken: string,
  reviewName: string, // full resource name e.g. "accounts/123/locations/456/reviews/abc"
  replyText: string
): Promise<void> {
  const res = await fetch(`${REVIEWS_API_BASE}/${reviewName}/reply`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!res.ok) {
    throw new Error(`Failed to post reply ${res.status}: ${await res.text()}`);
  }
}

// Normalized review shape shared by the live (Google) and DB (sample) paths so the
// dashboard pages render from a single view-model. Mirrors the Prisma `Review` fields
// the pages read, so a DB `Review` is assignable to it directly.
export interface ReviewVM {
  id: string; // full Google resource name for live reviews; Prisma id for DB reviews
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  text: string | null;
  publishedAt: Date;
  isReplied: boolean;
  replyText: string | null;
  repliedAt: Date | null;
  tags: string[];
  negativeTags: string[];
  unmappedInsights: string[];
}

// Map a live Google review into the shared view-model. Live reviews carry no AI
// enrichment, so the tag/insight arrays are empty until a batch analysis runs.
export function toReviewVM(review: GmbReview): ReviewVM {
  return {
    id: review.name,
    authorName: review.reviewer?.displayName ?? "Anonymous",
    authorPhoto: review.reviewer?.profilePhotoUrl ?? null,
    rating: STAR_RATING_MAP[review.starRating] ?? 0,
    text: review.comment ?? null,
    publishedAt: new Date(review.createTime),
    isReplied: !!review.reviewReply,
    replyText: review.reviewReply?.comment ?? null,
    repliedAt: review.reviewReply?.updateTime
      ? new Date(review.reviewReply.updateTime)
      : null,
    tags: [],
    negativeTags: [],
    unmappedInsights: [],
  };
}

export { STAR_RATING_MAP };
