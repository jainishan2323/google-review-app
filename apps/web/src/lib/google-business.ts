// Google Business Profile API wrapper
// Docs: https://developers.google.com/my-business/reference/rest

const REVIEWS_API_BASE =
  "https://mybusiness.googleapis.com/v4";

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

export async function fetchReviews(
  accessToken: string,
  locationName: string
): Promise<GmbReview[]> {
  const res = await fetch(`${REVIEWS_API_BASE}/${locationName}/reviews`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.reviews as GmbReview[]) ?? [];
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

export { STAR_RATING_MAP };
