// TODO(perf, pre-public): re-add `unstable_cache` from "next/cache" — see getFormData.
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
 * Loads the business + form config for a given id. Returns null when the
 * business doesn't exist.
 *
 * TODO(perf, pre-public): re-enable caching before launch. While testing we hit
 * Postgres on every request so data/config edits show up instantly — no waiting
 * on a 5-min TTL. Restore by wrapping the body in `unstable_cache(fn,
 * ["form-data", businessId], { revalidate: 300, tags: [`form-config:${businessId}`] })`
 * for fast TTFB on slow networks / cold Vercel lambdas. Also flip the ISR
 * `revalidate` back on in app/[businessId]/page.tsx.
 */
export async function getFormData(businessId: string): Promise<FormData | null> {
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
}
