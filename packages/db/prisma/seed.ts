import { PrismaClient } from "@prisma/client";
import ahaaReviews from "../../../apps/web/src/mock/ahaa-indisches-restaurant.json";
import saravanaaReviews from "../../../apps/web/src/mock/sarvanaa-bhavan.json";
import agniReviews from "../../../apps/web/src/mock/agni-berlin.json";

const prisma = new PrismaClient();

const DEV_GOOGLE_PLACE_ID = "ChIJU6S7CYpPqEcReRGBbxw0PRI";
const DEV_GOOGLE_LOCATION_ID = "dev-location-001";
const DEV_GOOGLE_MAPS_REVIEW_URL = "https://g.page/r/dev-review-url";
const DEV_BUSINESS_NAME = "Spice Garden Berlin";
const DEV_USER_EMAIL = "dev@example.com";

// ── Taxonomy seed helpers ────────────────────────────────────
//
// Tags now have a stable IDENTITY (the cuid) separate from their per-language
// DISPLAY labels. Feedback stores identities, never wording. These helpers build
// a template-seeded taxonomy (en + de labels, canonical keys) and return a
// label→{id,polarity} map so feedback rows can be seeded by identity.

type Polarity = "positive" | "negative";

const SUPPORTED_LANGUAGES = ["en", "de"];
const DEFAULT_LANGUAGE = "en";

/** German equivalents for every English chip/category label used in the seed. */
const DE: Record<string, string> = {
  // categories
  Kitchen: "Küche",
  "Front of House": "Service",
  Atmosphere: "Ambiente",
  Food: "Essen",
  Service: "Service",
  // positive tags
  "Great Food": "Tolles Essen",
  "Good Value": "Gutes Preis-Leistungs-Verhältnis",
  "Great Service": "Toller Service",
  "Friendly Staff": "Freundliches Personal",
  "Fast Service": "Schneller Service",
  "Clean Environment": "Sauberes Ambiente",
  "Highly Recommend": "Sehr empfehlenswert",
  "Delicious Food": "Köstliches Essen",
  "Authentic Taste": "Authentischer Geschmack",
  "Great Portions": "Große Portionen",
  "Attentive Service": "Aufmerksamer Service",
  "Nice Ambiance": "Schönes Ambiente",
  "Clean Space": "Sauberer Raum",
  "Outdoor Seating": "Außensitzplätze",
  "Fresh Ingredients": "Frische Zutaten",
  "Comfortable Seating": "Bequeme Sitzplätze",
  "Great Value": "Top Preis-Leistung",
  "Good Vegan Options": "Gute vegane Optionen",
  "Warm Hosts": "Herzliche Gastgeber",
  "Cozy Spot": "Gemütlicher Ort",
  "Hidden Gem": "Geheimtipp",
  // negative tags
  Overpriced: "Zu teuer",
  "Long Wait": "Lange Wartezeit",
  "Poor Communication": "Schlechte Kommunikation",
  Unprofessional: "Unprofessionell",
  Noisy: "Laut",
  "Needs Improvement": "Verbesserungswürdig",
  "Bland Taste": "Fader Geschmack",
  "Small Portions": "Kleine Portionen",
  "Order Mix-up": "Bestellfehler",
  "Inattentive Staff": "Unaufmerksames Personal",
  "Cramped Space": "Beengter Raum",
  "Stale Food": "Altes Essen",
  "Rude Staff": "Unhöfliches Personal",
  "Slow Service": "Langsamer Service",
  "Dirty Tables": "Schmutzige Tische",
  "Unfriendly Staff": "Unfreundliches Personal",
  "Limited Seating": "Wenige Sitzplätze",
};

/** Derive a cross-business canonical key from an English label. */
function canonical(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Build the bilingual labels map for an English-authored label. */
function labelsFor(en: string): { en: string; de: string } {
  return { en, de: DE[en] ?? en };
}

interface CategorySpec {
  en: string;
  positive: string[];
  negative: string[];
}

/**
 * Replace a form's taxonomy with template-seeded categories + tags. Deleting the
 * categories cascades to their tags (onDelete: Cascade), so re-seeding is idempotent.
 * Returns an English-label → {id, polarity} map for seeding feedback by identity.
 */
async function seedTaxonomy(
  formConfigId: string,
  cats: CategorySpec[]
): Promise<Map<string, { id: string; polarity: Polarity }>> {
  await prisma.feedbackCategory.deleteMany({ where: { formConfigId } });
  const map = new Map<string, { id: string; polarity: Polarity }>();

  for (let ci = 0; ci < cats.length; ci++) {
    const c = cats[ci];
    const category = await prisma.feedbackCategory.create({
      data: {
        formConfigId,
        labels: labelsFor(c.en),
        canonicalKey: canonical(c.en),
        order: ci,
      },
    });

    const seedTags = async (labels: string[], polarity: Polarity, base: number) => {
      for (let i = 0; i < labels.length; i++) {
        const tag = await prisma.tag.create({
          data: {
            categoryId: category.id,
            polarity,
            labels: labelsFor(labels[i]),
            canonicalKey: canonical(labels[i]),
            authoredLanguage: "en",
            order: base + i,
            source: "template",
          },
        });
        map.set(labels[i], { id: tag.id, polarity });
      }
    };

    await seedTags(c.positive, "positive", 0);
    await seedTags(c.negative, "negative", 100);
  }

  return map;
}

const SAMPLE_TEXTS = [
  "Really enjoyed my visit, will definitely come back!",
  "Service was a bit slow but the food made up for it.",
  "Absolutely love this place, everything was perfect.",
  "Had a mixed experience — staff was great but the wait was too long.",
  "Best curry I've had in Berlin. Highly recommend.",
  "Decent food but nothing special.",
  "The ambiance is lovely. Staff went above and beyond.",
  null,
  null,
  null, // some with no text
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function parseRelativeDate(str: string): Date {
  const s = str.replace(/^Edited\s+/i, "").trim();
  const match = s.match(/^(\d+|a|an)\s+(day|week|month|year)s?\s+ago$/i);
  if (!match) return new Date();
  const qty = match[1].toLowerCase() === "a" || match[1].toLowerCase() === "an" ? 1 : parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const d = new Date();
  if (unit === "day")   d.setDate(d.getDate() - qty);
  if (unit === "week")  d.setDate(d.getDate() - qty * 7);
  if (unit === "month") d.setMonth(d.getMonth() - qty);
  if (unit === "year")  d.setFullYear(d.getFullYear() - qty);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Deterministic feedback rows spread over the past 90 days
const FEEDBACK_ROWS = [
  // High ratings → positive tags
  { daysBack: 1,  rating: 5, tags: ["Great Service", "Friendly Staff"],         source: "google_redirect" },
  { daysBack: 2,  rating: 5, tags: ["Great Food", "Highly Recommend"],          source: "private" },
  { daysBack: 3,  rating: 4, tags: ["Clean Environment", "Good Value"],         source: "google_redirect" },
  { daysBack: 5,  rating: 5, tags: ["Great Service", "Fast Service"],           source: "google_redirect" },
  { daysBack: 7,  rating: 4, tags: ["Friendly Staff", "Great Food"],            source: "private" },
  { daysBack: 8,  rating: 5, tags: ["Highly Recommend", "Great Service"],       source: "google_redirect" },
  { daysBack: 10, rating: 3, tags: ["Long Wait", "Good Value"],                 source: "private" },
  { daysBack: 12, rating: 2, tags: ["Poor Communication", "Long Wait"],         source: "private" },
  { daysBack: 14, rating: 5, tags: ["Great Food", "Clean Environment"],         source: "google_redirect" },
  { daysBack: 15, rating: 4, tags: ["Great Service", "Friendly Staff"],         source: "private" },
  { daysBack: 18, rating: 1, tags: ["Unprofessional", "Poor Communication"],    source: "private" },
  { daysBack: 20, rating: 5, tags: ["Great Food", "Great Service"],             source: "google_redirect" },
  { daysBack: 22, rating: 3, tags: ["Noisy", "Long Wait"],                      source: "private" },
  { daysBack: 25, rating: 4, tags: ["Good Value", "Friendly Staff"],            source: "google_redirect" },
  { daysBack: 28, rating: 5, tags: ["Highly Recommend", "Clean Environment"],   source: "private" },
  { daysBack: 30, rating: 2, tags: ["Overpriced", "Needs Improvement"],         source: "private" },
  { daysBack: 35, rating: 5, tags: ["Great Service", "Great Food"],             source: "google_redirect" },
  { daysBack: 38, rating: 4, tags: ["Fast Service", "Good Value"],              source: "private" },
  { daysBack: 42, rating: 3, tags: ["Long Wait"],                               source: "private" },
  { daysBack: 50, rating: 5, tags: ["Friendly Staff", "Great Food"],            source: "google_redirect" },
  { daysBack: 55, rating: 4, tags: ["Clean Environment", "Great Service"],      source: "private" },
  { daysBack: 60, rating: 2, tags: ["Poor Communication", "Overpriced"],        source: "private" },
  { daysBack: 70, rating: 5, tags: ["Highly Recommend", "Great Food"],          source: "google_redirect" },
  { daysBack: 80, rating: 4, tags: ["Great Service", "Fast Service"],           source: "private" },
  { daysBack: 88, rating: 3, tags: ["Needs Improvement", "Long Wait"],          source: "private" },
] as const;

async function main() {
  // Dev user
  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: {
      email: DEV_USER_EMAIL,
      name: "Dev Owner",
      role: "OWNER",
    },
  });

  // Dev business
  const business = await prisma.business.upsert({
    where: { googleLocationId: DEV_GOOGLE_LOCATION_ID },
    update: {
      googlePlaceId: DEV_GOOGLE_PLACE_ID,
      googleMapsReviewUrl: DEV_GOOGLE_MAPS_REVIEW_URL,
    },
    create: {
      name: DEV_BUSINESS_NAME,
      googleLocationId: DEV_GOOGLE_LOCATION_ID,
      googlePlaceId: DEV_GOOGLE_PLACE_ID,
      googleMapsReviewUrl: DEV_GOOGLE_MAPS_REVIEW_URL,
      ownerId: user.id,
    },
  });

  // Seed FormConfig + taxonomy (idempotent)
  const formConfig = await prisma.formConfig.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      brandColor: "#16a34a",
      welcomeMessage: {
        en: "Thanks for visiting Spice Garden Berlin! We'd love your feedback.",
        de: "Danke für Ihren Besuch im Spice Garden Berlin! Wir freuen uns über Ihr Feedback.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
    update: {
      welcomeMessage: {
        en: "Thanks for visiting Spice Garden Berlin! We'd love your feedback.",
        de: "Danke für Ihren Besuch im Spice Garden Berlin! Wir freuen uns über Ihr Feedback.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
  });

  const spiceTags = await seedTaxonomy(formConfig.id, [
    { en: "Kitchen", positive: ["Great Food", "Good Value"], negative: ["Overpriced"] },
    {
      en: "Front of House",
      positive: ["Great Service", "Friendly Staff", "Fast Service"],
      negative: ["Long Wait", "Poor Communication", "Unprofessional"],
    },
    {
      en: "Atmosphere",
      positive: ["Clean Environment", "Highly Recommend"],
      negative: ["Noisy", "Needs Improvement"],
    },
  ]);

  // Clear existing feedback so re-seeding is idempotent
  await prisma.anonymousFeedback.deleteMany({ where: { businessId: business.id } });

  // Seed 25 feedback rows across past 90 days. `tags` holds tag IDENTITIES;
  // `negativeTags` is derived from each tag's polarity (by identity).
  for (const row of FEEDBACK_ROWS) {
    const resolved = row.tags
      .map((label) => spiceTags.get(label))
      .filter((t): t is { id: string; polarity: Polarity } => t !== undefined);
    const tagIds = resolved.map((t) => t.id);
    const negativeTagIds = resolved.filter((t) => t.polarity === "negative").map((t) => t.id);

    await prisma.anonymousFeedback.create({
      data: {
        businessId: business.id,
        rating: row.rating,
        tags: tagIds,
        negativeTags: negativeTagIds,
        source: row.source,
        status: row.daysBack <= 7 ? "unread" : "read",
        text: pick(SAMPLE_TEXTS) ?? null,
        generatedReview:
          row.rating >= 4
            ? `${pick(["Wonderful", "Great", "Fantastic", "Excellent"])} experience at ${DEV_BUSINESS_NAME}! ${row.tags.join(" and ")} really stood out.`
            : null,
        createdAt: daysAgo(row.daysBack),
      },
    });
  }

  console.log(`✅ Business seeded: ${business.id} — ${business.name}`);
  console.log(`   Seeded 3 categories + tags (Kitchen, Front of House, Atmosphere).`);
  console.log(`   Seeded ${FEEDBACK_ROWS.length} feedback rows across the past 90 days.`);
  console.log(`   Use this businessId in your API calls: ${business.id}`);

  // ── aahaa Indisches Restaurant ────────────────────────────

  const ahaaBusiness = await prisma.business.upsert({
    where: { googleLocationId: "ahaa-location-001" },
    update: {
      googlePlaceId: "ChIJw6F9_XlRqEcRSsXtXHA8Ju0",
      googleMapsReviewUrl: "https://www.google.com/maps/search/?api=1&query=aahaa%20Indisches%20Restaurant&query_place_id=ChIJw6F9_XlRqEcRSsXtXHA8Ju0",
    },
    create: {
      name: "aahaa Indisches Restaurant",
      googleLocationId: "ahaa-location-001",
      googlePlaceId: "ChIJw6F9_XlRqEcRSsXtXHA8Ju0",
      googleMapsReviewUrl: "https://www.google.com/maps/search/?api=1&query=aahaa%20Indisches%20Restaurant&query_place_id=ChIJw6F9_XlRqEcRSsXtXHA8Ju0",
      ownerId: user.id,
    },
  });

  // FormConfig + taxonomy for aahaa
  const ahaaFormConfig = await prisma.formConfig.upsert({
    where: { businessId: ahaaBusiness.id },
    create: {
      businessId: ahaaBusiness.id,
      brandColor: "#b45309",
      welcomeMessage: {
        en: "Thank you for visiting aahaa Indisches Restaurant! We'd love to hear from you.",
        de: "Danke für Ihren Besuch im aahaa Indisches Restaurant! Wir freuen uns von Ihnen zu hören.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
    update: {
      welcomeMessage: {
        en: "Thank you for visiting aahaa Indisches Restaurant! We'd love to hear from you.",
        de: "Danke für Ihren Besuch im aahaa Indisches Restaurant! Wir freuen uns von Ihnen zu hören.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
  });

  await seedTaxonomy(ahaaFormConfig.id, [
    {
      en: "Food",
      positive: ["Delicious Food", "Authentic Taste", "Great Portions", "Good Value"],
      negative: ["Bland Taste", "Overpriced", "Small Portions"],
    },
    {
      en: "Service",
      positive: ["Friendly Staff", "Attentive Service", "Fast Service"],
      negative: ["Long Wait", "Order Mix-up", "Inattentive Staff"],
    },
    {
      en: "Atmosphere",
      positive: ["Nice Ambiance", "Clean Space", "Outdoor Seating"],
      negative: ["Noisy", "Cramped Space"],
    },
  ]);

  // Seed Google Reviews from JSON — skip dupes idempotently
  await prisma.review.deleteMany({ where: { businessId: ahaaBusiness.id } });
  const ahaaReviewData = ahaaReviews as Array<{
    stars: number;
    name: string;
    reviewUrl: string;
    text: string | null;
  }>;

  let reviewsSeeded = 0;
  for (let i = 0; i < ahaaReviewData.length; i++) {
    const r = ahaaReviewData[i];
    // Spread reviews over the past 180 days, newest first
    const publishedAt = daysAgo(Math.floor((i / ahaaReviewData.length) * 180));
    await prisma.review.create({
      data: {
        businessId: ahaaBusiness.id,
        googleReviewId: r.reviewUrl,
        authorName: r.name,
        rating: r.stars,
        text: r.text ?? null,
        publishedAt,
      },
    });
    reviewsSeeded++;
  }

  console.log(`✅ Business seeded: ${ahaaBusiness.id} — ${ahaaBusiness.name}`);
  console.log(`   Seeded 3 FeedbackCategory rows (Food, Service, Atmosphere).`);
  console.log(`   Seeded ${reviewsSeeded} Google Review rows.`);
  console.log(`   Use this businessId in your API calls: ${ahaaBusiness.id}`);

  // ── Saravanaa Bhavan ──────────────────────────────────────

  const saravanaa = await prisma.business.upsert({
    where: { googleLocationId: "saravanaa-bhavan-001" },
    update: {
      googlePlaceId: "ChIJQ9oatEZRqEcRlRVb2Cpqx1w",
    },
    create: {
      name: "Saravanaa Bhavan",
      googleLocationId: "saravanaa-bhavan-001",
      googlePlaceId: "ChIJQ9oatEZRqEcRlRVb2Cpqx1w",
      ownerId: user.id,
    },
  });

  const saravanaaFormConfig = await prisma.formConfig.upsert({
    where: { businessId: saravanaa.id },
    create: {
      businessId: saravanaa.id,
      brandColor: "#15803d",
      welcomeMessage: {
        en: "Thank you for visiting Saravanaa Bhavan! We'd love your feedback.",
        de: "Danke für Ihren Besuch im Saravanaa Bhavan! Wir freuen uns über Ihr Feedback.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
    update: {
      welcomeMessage: {
        en: "Thank you for visiting Saravanaa Bhavan! We'd love your feedback.",
        de: "Danke für Ihren Besuch im Saravanaa Bhavan! Wir freuen uns über Ihr Feedback.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
  });

  await seedTaxonomy(saravanaaFormConfig.id, [
    {
      en: "Food",
      positive: ["Authentic Taste", "Great Portions", "Good Value", "Fresh Ingredients"],
      negative: ["Bland Taste", "Overpriced", "Small Portions", "Stale Food"],
    },
    {
      en: "Service",
      positive: ["Friendly Staff", "Attentive Service", "Fast Service"],
      negative: ["Long Wait", "Rude Staff", "Order Mix-up", "Slow Service"],
    },
    {
      en: "Atmosphere",
      positive: ["Clean Space", "Nice Ambiance", "Comfortable Seating"],
      negative: ["Noisy", "Cramped Space", "Dirty Tables"],
    },
  ]);

  await prisma.review.deleteMany({ where: { businessId: saravanaa.id } });

  type SaravanaaReview = {
    reviewId: string;
    authorName: string;
    authorPhoto?: string;
    rating: number;
    text: string | null;
    publishedAt: string;
    ownerReply?: string | null;
  };

  let saravanaaSeeded = 0;
  for (const r of saravanaaReviews as SaravanaaReview[]) {
    await prisma.review.create({
      data: {
        businessId: saravanaa.id,
        googleReviewId: r.reviewId,
        authorName: r.authorName,
        authorPhoto: r.authorPhoto ?? null,
        rating: r.rating,
        text: r.text ?? null,
        publishedAt: parseRelativeDate(r.publishedAt),
        isReplied: !!r.ownerReply,
        replyText: r.ownerReply ?? null,
        repliedAt: r.ownerReply ? parseRelativeDate(r.publishedAt) : null,
      },
    });
    saravanaaSeeded++;
  }

  console.log(`✅ Business seeded: ${saravanaa.id} — ${saravanaa.name}`);
  console.log(`   Seeded ${saravanaaSeeded} Google Review rows (${saravanaaReviews.filter((r: SaravanaaReview) => r.ownerReply).length} with owner replies).`);
  console.log(`   Use this businessId in your API calls: ${saravanaa.id}`);

  // ── Agni (Moabit, Berlin) ─────────────────────────────────

  const agni = await prisma.business.upsert({
    where: { googleLocationId: "agni-berlin-001" },
    update: {
      googlePlaceId: "ChIJ9fc8fxFRqEcRMwkzsTU2yRU",
      googleMapsReviewUrl: "https://www.google.com/maps/search/?api=1&query=Agni&query_place_id=ChIJ9fc8fxFRqEcRMwkzsTU2yRU",
    },
    create: {
      name: "Agni",
      googleLocationId: "agni-berlin-001",
      googlePlaceId: "ChIJ9fc8fxFRqEcRMwkzsTU2yRU",
      googleMapsReviewUrl: "https://www.google.com/maps/search/?api=1&query=Agni&query_place_id=ChIJ9fc8fxFRqEcRMwkzsTU2yRU",
      ownerId: user.id,
    },
  });

  const agniFormConfig = await prisma.formConfig.upsert({
    where: { businessId: agni.id },
    create: {
      businessId: agni.id,
      brandColor: "#c2410c",
      welcomeMessage: {
        en: "Thanks for visiting Agni! We'd love to hear about your meal.",
        de: "Danke für Ihren Besuch bei Agni! Wir freuen uns über Ihr Feedback zu Ihrem Essen.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
    update: {
      welcomeMessage: {
        en: "Thanks for visiting Agni! We'd love to hear about your meal.",
        de: "Danke für Ihren Besuch bei Agni! Wir freuen uns über Ihr Feedback zu Ihrem Essen.",
      },
      defaultLanguage: DEFAULT_LANGUAGE,
      supportedLanguages: SUPPORTED_LANGUAGES,
    },
  });

  await seedTaxonomy(agniFormConfig.id, [
    {
      en: "Food",
      positive: ["Authentic Taste", "Delicious Food", "Great Value", "Good Vegan Options"],
      negative: ["Bland Taste", "Overpriced", "Small Portions"],
    },
    {
      en: "Service",
      positive: ["Friendly Staff", "Warm Hosts", "Fast Service"],
      negative: ["Unfriendly Staff", "Long Wait", "Order Mix-up"],
    },
    {
      en: "Atmosphere",
      positive: ["Cozy Spot", "Clean Space", "Hidden Gem"],
      negative: ["Cramped Space", "Limited Seating", "Noisy"],
    },
  ]);

  await prisma.review.deleteMany({ where: { businessId: agni.id } });

  type AgniReview = {
    stars: number;
    name: string;
    reviewUrl: string;
    text: string | null;
  };

  // The scraped file contains duplicate reviewUrls — dedupe on the unique key.
  const seenAgni = new Set<string>();
  const agniReviewData = (agniReviews as AgniReview[]).filter((r) => {
    if (seenAgni.has(r.reviewUrl)) return false;
    seenAgni.add(r.reviewUrl);
    return true;
  });

  let agniSeeded = 0;
  for (let i = 0; i < agniReviewData.length; i++) {
    const r = agniReviewData[i];
    // Spread reviews over the past 180 days, newest first
    const publishedAt = daysAgo(Math.floor((i / agniReviewData.length) * 180));
    await prisma.review.create({
      data: {
        businessId: agni.id,
        googleReviewId: r.reviewUrl,
        authorName: r.name,
        rating: r.stars,
        text: r.text ?? null,
        publishedAt,
      },
    });
    agniSeeded++;
  }

  console.log(`✅ Business seeded: ${agni.id} — ${agni.name}`);
  console.log(`   Seeded 3 FeedbackCategory rows (Food, Service, Atmosphere).`);
  console.log(`   Seeded ${agniSeeded} Google Review rows.`);
  console.log(`   Use this businessId in your API calls: ${agni.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
