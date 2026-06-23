import { prisma } from "@repo/db";
import { refreshAccessToken } from "@/lib/google-oauth";

// A business is wired to live Google data once the "Connect Google" flow has run:
// it then holds an OAuth grant AND a real location resource name. Seeded/placeholder
// businesses keep slugs like "agni-berlin"; real ones are "accounts/123/locations/456".
export function isLiveLinked(googleLocationId: string): boolean {
  return googleLocationId.startsWith("accounts/");
}

// Return a valid access token for the business, refreshing + persisting if the
// stored one has expired. Returns null if the business has no usable grant.
export async function getFreshAccessToken(
  businessId: string
): Promise<string | null> {
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { accessToken: true, refreshToken: true, tokenExpiresAt: true },
  });
  if (!biz) return null;

  // Still valid (60s safety margin)?
  if (
    biz.accessToken &&
    biz.tokenExpiresAt &&
    biz.tokenExpiresAt.getTime() > Date.now() + 60_000
  ) {
    return biz.accessToken;
  }

  if (!biz.refreshToken) return biz.accessToken ?? null;

  try {
    const refreshed = await refreshAccessToken(biz.refreshToken);
    await prisma.business.update({
      where: { id: businessId },
      data: {
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        ...(refreshed.refreshToken
          ? { refreshToken: refreshed.refreshToken }
          : {}),
      },
    });
    return refreshed.accessToken;
  } catch (err) {
    console.error("Failed to refresh Google token", err);
    return null;
  }
}
