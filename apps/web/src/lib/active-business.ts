import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import {
  listAccounts,
  listLocations,
  fetchReviews,
  toReviewVM,
  type ReviewVM,
} from "@/lib/google-business";

// Hardcoded business used for local testing / when not signed in. Single source of truth —
// pages should resolve the active business via getActiveBusiness() rather than redefining this.
export const DEV_BUSINESS_ID =
  process.env.DEV_BUSINESS_ID ?? "cmpabfbxs001np8qjvk5l6s14";

export interface ActiveBusiness {
  // "live": signed-in user linked to a real Google business → fetch from the API.
  // "db":   testing fallback → read seeded data from Postgres.
  mode: "live" | "db";
  businessId: string;
  businessName: string;
  googleLocationId: string;
  accessToken?: string; // present only in live mode
  // True when the user IS signed in but we couldn't link/read their real Google
  // business (e.g. Business Profile API quota not yet approved → 429), so the UI is
  // showing seeded sample data and should say so.
  isSampleData: boolean;
}

async function dbFallback(isSampleData: boolean): Promise<ActiveBusiness> {
  const business = await prisma.business.findUnique({
    where: { id: DEV_BUSINESS_ID },
    select: { name: true, googleLocationId: true },
  });
  return {
    mode: "db",
    businessId: DEV_BUSINESS_ID,
    businessName: business?.name ?? "Your Business",
    googleLocationId: business?.googleLocationId ?? "",
    isSampleData,
  };
}

// Resolve the business the current request should display.
// - Signed in + linked (or linkable) real Google business → live mode.
// - Otherwise → the hardcoded DEV business (testing path), kept fully intact.
export async function getActiveBusiness(): Promise<ActiveBusiness> {
  const session = await getServerSession(authOptions);

  // Not signed in, or token refresh failed → testing fallback (not flagged as sample;
  // dashboard routes are auth-guarded so this is really the logged-out/local case).
  if (!session?.userId || !session?.accessToken || session.error) {
    return dbFallback(false);
  }

  // Already linked?
  let business = await prisma.business.findFirst({
    where: { ownerId: session.userId },
    select: { id: true, name: true, googleLocationId: true },
  });

  // Lazy-link on first visit: discover the account + first location and persist it.
  if (!business) {
    try {
      const accounts = await listAccounts(session.accessToken);
      const account = accounts[0];
      if (!account) return dbFallback(true);

      const locations = await listLocations(session.accessToken, account.name);
      const location = locations[0];
      if (!location) return dbFallback(true);

      // Reviews/replies need the combined "accounts/123/locations/456" resource name.
      const googleLocationId = `${account.name}/${location.name}`;

      business = await prisma.business.upsert({
        where: { googleLocationId },
        update: { ownerId: session.userId, accessToken: session.accessToken },
        create: {
          name: location.title ?? "My Business",
          googleLocationId,
          ownerId: session.userId,
          accessToken: session.accessToken,
        },
        select: { id: true, name: true, googleLocationId: true },
      });
    } catch (err) {
      console.error("Failed to link Google business", err);
      return dbFallback(true);
    }
  }

  return {
    mode: "live",
    businessId: business.id,
    businessName: business.name,
    googleLocationId: business.googleLocationId,
    accessToken: session.accessToken,
    isSampleData: false,
  };
}

// Fetch reviews for the active business as a single normalized list.
// Live mode hits the Google API; DB mode reads seeded reviews. Pages filter in-memory.
export async function getActiveReviews(ctx: ActiveBusiness): Promise<ReviewVM[]> {
  if (ctx.mode === "live" && ctx.accessToken) {
    try {
      const reviews = await fetchReviews(ctx.accessToken, ctx.googleLocationId);
      return reviews.map(toReviewVM);
    } catch (err) {
      console.error("Failed to fetch live reviews", err);
      return [];
    }
  }

  return prisma.review.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { publishedAt: "desc" },
  });
}
