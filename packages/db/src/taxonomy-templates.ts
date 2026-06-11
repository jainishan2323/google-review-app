// Code-defined Taxonomy Templates — one per Business Type. Seeded into a business's
// form ONCE at onboarding (see applyTaxonomyTemplate), then owned/edited per business.
// The template is not a live link: editing it here does not change already-onboarded
// businesses. Adding a Business Type = add a key here + a deploy. See ADR-0006.

import type { Prisma } from "@prisma/client";

/** One tag in a template. `key` (canonicalKey) and `de` are optional — see notes below. */
interface TemplateTag {
  en: string; // English label (authoring language / default)
  de?: string; // German label; if omitted, auto-filled on the owner's first settings save
  key?: string; // canonicalKey; if omitted, derived from `en` ("Long Wait" → "long_wait")
}

interface TemplateCategory {
  en: string; // category label (e.g. "Food")
  de?: string;
  key?: string;
  positive: TemplateTag[]; // ≤ 4 (active-chips-per-polarity guardrail)
  negative: TemplateTag[]; // ≤ 4
}

export interface TaxonomyTemplate {
  defaultLanguage: string; // "en"
  supportedLanguages: string[]; // ["en", "de"]
  brandColor: string; // form default
  welcomeMessage: string; // form default greeting
  categories: TemplateCategory[];
}

/** Keyed by Business.businessType. Add "dentist", "doctor", … later. */
export const TAXONOMY_TEMPLATES: Record<string, TaxonomyTemplate> = {
  restaurant: {
    defaultLanguage: "en",
    supportedLanguages: ["en", "de"],
    brandColor: "#16a34a",
    welcomeMessage: "Thanks for visiting! We'd love your feedback.",
    categories: [
      {
        en: "Food",
        de: "Essen",
        positive: [
          { en: "Authentic Taste", de: "Authentischer Geschmack" },
          { en: "Delicious Food", de: "Köstliches Essen" },
          { en: "Great Portions", de: "Große Portionen" },
          { en: "Good Value", de: "Gutes Preis-Leistungs-Verhältnis" },
        ],
        negative: [
          { en: "Bland Taste", de: "Fader Geschmack" },
          { en: "Overpriced", de: "Zu teuer" },
          { en: "Small Portions", de: "Kleine Portionen" },
          { en: "Stale Food", de: "Altes Essen" },
        ],
      },
      {
        en: "Service",
        de: "Service",
        positive: [
          { en: "Friendly Staff", de: "Freundliches Personal" },
          { en: "Attentive Service", de: "Aufmerksamer Service" },
          { en: "Fast Service", de: "Schneller Service" },
        ],
        negative: [
          { en: "Long Wait", de: "Lange Wartezeit" },
          { en: "Rude Staff", de: "Unhöfliches Personal" },
          { en: "Order Mix-up", de: "Bestellfehler" },
        ],
      },
      {
        en: "Atmosphere",
        de: "Ambiente",
        positive: [
          { en: "Nice Ambiance", de: "Schönes Ambiente" },
          { en: "Clean Space", de: "Sauberer Raum" },
          { en: "Comfortable Seating", de: "Bequeme Sitzplätze" },
        ],
        negative: [
          { en: "Noisy", de: "Laut" },
          { en: "Cramped Space", de: "Beengter Raum" },
          { en: "Dirty Tables", de: "Schmutzige Tische" },
        ],
      },
    ],
  },
};

/** The Business Type used when an onboarding request omits/has an unknown type. */
export const DEFAULT_BUSINESS_TYPE = "restaurant";

/** Human-readable labels for the Lantern onboarding selector. */
export const BUSINESS_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
];

/** Derive a canonical key from an English label ("Long Wait" → "long_wait"). */
function canonical(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function labelsFor(en: string, de?: string): Prisma.InputJsonValue {
  return de ? { en, de } : { en };
}

/**
 * Seed a business's form from its Business Type's Taxonomy Template. Create-only and
 * idempotent: if the business already has a FormConfig, this is a no-op (so it is safe
 * to call at onboarding and from a future "re-seed" path). Must run inside a transaction.
 *
 * Falls back to the default template when the type is unknown, so onboarding never
 * leaves a business without a form.
 */
export async function applyTaxonomyTemplate(
  tx: Prisma.TransactionClient,
  businessId: string,
  businessType: string
): Promise<{ applied: boolean }> {
  const existing = await tx.formConfig.findUnique({
    where: { businessId },
    select: { id: true },
  });
  if (existing) return { applied: false };

  const template = TAXONOMY_TEMPLATES[businessType] ?? TAXONOMY_TEMPLATES[DEFAULT_BUSINESS_TYPE];

  const config = await tx.formConfig.create({
    data: {
      businessId,
      brandColor: template.brandColor,
      welcomeMessage: template.welcomeMessage,
      defaultLanguage: template.defaultLanguage,
      supportedLanguages: template.supportedLanguages,
    },
  });

  for (let ci = 0; ci < template.categories.length; ci++) {
    const c = template.categories[ci];
    const category = await tx.feedbackCategory.create({
      data: {
        formConfigId: config.id,
        labels: labelsFor(c.en, c.de),
        canonicalKey: c.key ?? canonical(c.en),
        order: ci,
      },
    });

    const createTags = (tags: TemplateTag[], polarity: "positive" | "negative", base: number) =>
      Promise.all(
        tags.map((t, i) =>
          tx.tag.create({
            data: {
              categoryId: category.id,
              polarity,
              labels: labelsFor(t.en, t.de),
              canonicalKey: t.key ?? canonical(t.en),
              authoredLanguage: template.defaultLanguage,
              order: base + i,
              source: "template",
            },
          })
        )
      );

    await createTags(c.positive, "positive", 0);
    await createTags(c.negative, "negative", 100);
  }

  return { applied: true };
}
