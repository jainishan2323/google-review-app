import { unstable_cache } from "next/cache";
import { prisma, type FeedbackCategory } from "@repo/db";
import { normalizePlaceId } from "./place-id";

export interface FormCategory {
  name: string;
  positiveChips: string[];
  negativeChips: string[];
}

export interface FormData {
  business: {
    name: string;
    googlePlaceId: string | null;
    googleMapsReviewUrl: string | null;
  };
  config: {
    brandColor: string;
    logoUrl: string | null;
    welcomeMessage: string;
    categories: FormCategory[];
  } | null;
}

/**
 * Loads the business + form config for a given id.
 *
 * Wrapped in unstable_cache (revalidate 5 min, tagged per-business) so repeat
 * loads, ISR regenerations, and the /api/generate path are memory hits instead
 * of a Postgres round-trip — critical for TTFB on slow networks and for cold
 * Vercel lambdas. Returns null when the business doesn't exist.
 */
export const getFormData = (businessId: string): Promise<FormData | null> =>
  unstable_cache(
    async (): Promise<FormData | null> => {
      const [business, config] = await Promise.all([
        prisma.business.findUnique({
          where: { id: businessId },
          select: { name: true, googlePlaceId: true, googleMapsReviewUrl: true },
        }),
        prisma.formConfig.findUnique({
          where: { businessId },
          include: { categories: { orderBy: { order: "asc" } } },
        }),
      ]);

      if (!business) return null;

      return {
        business: {
          name: business.name,
          googlePlaceId: normalizePlaceId(business.googlePlaceId),
          googleMapsReviewUrl: business.googleMapsReviewUrl ?? null,
        },
        config: config
          ? {
              brandColor: config.brandColor,
              logoUrl: config.logoUrl ?? null,
              welcomeMessage: config.welcomeMessage,
              categories: config.categories.map((c: FeedbackCategory) => ({
                name: c.name,
                positiveChips: c.positiveChips,
                negativeChips: c.negativeChips,
              })),
            }
          : null,
      };
    },
    ["form-data", businessId],
    { revalidate: 300, tags: [`form-config:${businessId}`] }
  )();
