import { unstable_cache } from "next/cache";
import { prisma } from "@repo/db";
import { resolveLabel, type FormTag } from "@repo/types";
import { normalizePlaceId } from "./place-id";

export interface FormCategory {
  /** Category display label resolved to the business default language. */
  name: string;
  /** Active tags in this category, label resolved + polarity attached. */
  tags: FormTag[];
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
    defaultLanguage: string;
    categories: FormCategory[];
  } | null;
}

// Form payload cache TTL (production only). See docs/adr/0016.
const CACHE_TTL_SECONDS = 30;

/**
 * Loads the business + form config for a given id. Returns null when the
 * business doesn't exist.
 */
async function loadFormData(businessId: string): Promise<FormData | null> {
  const [business, config] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, googlePlaceId: true, googleMapsReviewUrl: true },
    }),
    prisma.formConfig.findUnique({
      where: { businessId },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: {
            // Only active tags render on the form; inactive stay resolvable for history.
            tags: { where: { active: true }, orderBy: { order: "asc" } },
          },
        },
      },
    }),
  ]);

  if (!business) return null;

  const defaultLanguage = config?.defaultLanguage ?? "en";

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
          // welcomeMessage is a per-language map; resolve to the default language.
          welcomeMessage: resolveLabel(config.welcomeMessage, { default: defaultLanguage }),
          defaultLanguage,
          categories: config.categories.map((c) => ({
            name: resolveLabel(c.labels, { default: defaultLanguage }),
            tags: c.tags.map((t) => ({
              id: t.id,
              label: resolveLabel(t.labels, {
                default: defaultLanguage,
                authored: t.authoredLanguage,
              }),
              polarity: t.polarity,
            })),
          })),
        }
      : null,
  };
}

/**
 * Cached entry point. In production the computed payload is cached for 30s via
 * `unstable_cache`, keyed per-business, keeping the relational query (business +
 * config + categories + tags) off the per-scan hot path — pairs with 30s ISR on
 * app/[businessId]/page.tsx.
 *
 * There is NO cross-deployment invalidation: the dashboard and Lantern are separate
 * Vercel deployments and can't bust the form's cache, so freshness rides the 30s TTL
 * (+ ISR stale-while-revalidate). See docs/adr/0016.
 *
 * In development the cache is bypassed entirely so local config edits show instantly —
 * `next dev` ignores route ISR, but `unstable_cache` would otherwise persist for 30s.
 */
export const getFormData =
  process.env.NODE_ENV === "production"
    ? unstable_cache(loadFormData, ["form-data"], { revalidate: CACHE_TTL_SECONDS })
    : loadFormData;
