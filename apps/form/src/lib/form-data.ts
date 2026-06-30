import { unstable_cache } from "next/cache";
import { prisma } from "@repo/db";
import { resolveLabel, type FormTag } from "@repo/types";
import { normalizePlaceId } from "./place-id";
import { DEFAULT_WELCOME, isLocale } from "./i18n";

export interface FormCategory {
  /** Category display label resolved to this language. */
  name: string;
  /** Active tags in this category, label resolved + polarity attached. */
  tags: FormTag[];
}

/** The language-varying slice of the form config — one of these per supported language. */
export interface LanguageConfig {
  welcomeMessage: string;
  categories: FormCategory[];
}

export interface FormData {
  business: {
    name: string;
    googlePlaceId: string | null;
    googleMapsReviewUrl: string | null;
  };
  config: {
    // Language-invariant branding.
    brandColor: string;
    logoUrl: string | null;
    // The language a scan opens in (absent/invalid cue) and the analyzer's anchor.
    defaultLanguage: string;
    // Drives the customer-facing switcher; always includes defaultLanguage.
    supportedLanguages: string[];
    // Per-supported-language pre-resolved config; the client picks byLanguage[active].
    // resolveLabel's fallback chain stays server-only (ADR 0021).
    byLanguage: Record<string, LanguageConfig>;
  } | null;
}

// Form payload cache TTL (production only). See docs/adr/0016.
const CACHE_TTL_SECONDS = 30;

/**
 * Resolve the welcome for one language. Unlike chips, welcome never crosses to
 * another language's authored text — a German form must not show an English custom
 * welcome. So: authored-in-this-language → localized code-default (ADR 0021).
 */
function resolveWelcome(
  welcomeMap: unknown,
  lang: string,
  defaultLanguage: string
): string {
  const map =
    welcomeMap && typeof welcomeMap === "object"
      ? (welcomeMap as Record<string, unknown>)
      : {};
  const authored = map[lang];
  if (typeof authored === "string" && authored.length > 0) return authored;
  if (isLocale(lang)) return DEFAULT_WELCOME[lang];
  if (isLocale(defaultLanguage)) return DEFAULT_WELCOME[defaultLanguage];
  return DEFAULT_WELCOME.en;
}

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

  const businessOut = {
    name: business.name,
    googlePlaceId: normalizePlaceId(business.googlePlaceId),
    googleMapsReviewUrl: business.googleMapsReviewUrl ?? null,
  };

  if (!config) {
    return { business: businessOut, config: null };
  }

  const defaultLanguage = config.defaultLanguage;
  // defaultLanguage is always offered, even if a row omitted it from the array.
  const supportedLanguages = Array.from(
    new Set([defaultLanguage, ...config.supportedLanguages])
  );

  // Pre-resolve the language-varying config once per supported language. Chips keep
  // the full fallback chain (a chip in another language beats a blank one); only the
  // welcome gets the no-cross-language rule above.
  const byLanguage: Record<string, LanguageConfig> = {};
  for (const lang of supportedLanguages) {
    byLanguage[lang] = {
      welcomeMessage: resolveWelcome(config.welcomeMessage, lang, defaultLanguage),
      categories: config.categories.map((c) => ({
        name: resolveLabel(c.labels, { active: lang, default: defaultLanguage }),
        tags: c.tags.map((t) => ({
          id: t.id,
          label: resolveLabel(t.labels, {
            active: lang,
            default: defaultLanguage,
            authored: t.authoredLanguage,
          }),
          polarity: t.polarity,
        })),
      })),
    };
  }

  return {
    business: businessOut,
    config: {
      brandColor: config.brandColor,
      logoUrl: config.logoUrl ?? null,
      defaultLanguage,
      supportedLanguages,
      byLanguage,
    },
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
