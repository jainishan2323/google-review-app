// Google Business Profile API wrapper
// Docs: https://developers.google.com/my-business/reference/rest

const REVIEWS_API_BASE =
  "https://mybusiness.googleapis.com/v4";

// Newer GBP surfaces are split across two v1 hosts; reviews still live on legacy v4.
const ACCOUNT_MGMT_API_BASE =
  "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_API_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface GmbAccount {
  name: string; // e.g. "accounts/123"
  accountName?: string;
  type?: string;
}

export interface GmbLocation {
  name: string; // e.g. "locations/456" (v1 BI API; no account prefix)
  title?: string;
}

/**
 * Exchange a refresh token for a fresh access token. Access tokens expire in ~1h,
 * so anything reusing a stored credential must refresh first. Requires
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in the environment.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

/** List the Business Profile accounts the token has access to. */
export async function listAccounts(accessToken: string): Promise<GmbAccount[]> {
  const res = await fetch(`${ACCOUNT_MGMT_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`listAccounts error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.accounts as GmbAccount[]) ?? [];
}

/**
 * List the locations under an account. `accountName` is the full resource name,
 * e.g. "accounts/123". Returns v1 location names like "locations/456".
 */
export async function listLocations(
  accessToken: string,
  accountName: string
): Promise<GmbLocation[]> {
  const url = `${BUSINESS_INFO_API_BASE}/${accountName}/locations?readMask=name,title`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`listLocations error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.locations as GmbLocation[]) ?? [];
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
