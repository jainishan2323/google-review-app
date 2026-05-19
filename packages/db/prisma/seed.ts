import { PrismaClient } from "@prisma/client";
import ahaaReviews from "../../../apps/web/src/mock/ahaa-indisches-restaurant.json";
import saravanaaReviews from "../../../apps/web/src/mock/sarvanaa-bhavan.json";

const prisma = new PrismaClient();

const DEV_GOOGLE_PLACE_ID = "ChIJU6S7CYpPqEcReRGBbxw0PRI";
const DEV_GOOGLE_LOCATION_ID = "dev-location-001";
const DEV_GOOGLE_MAPS_REVIEW_URL = "https://g.page/r/dev-review-url";
const DEV_BUSINESS_NAME = "Spice Garden Berlin";
const DEV_USER_EMAIL = "dev@example.com";

// ── Seed helpers ─────────────────────────────────────────────

const POSITIVE_TAGS = [
  "Great Service",
  "Clean Environment",
  "Friendly Staff",
  "Highly Recommend",
  "Great Food",
  "Fast Service",
  "Good Value",
];

const NEGATIVE_TAGS = [
  "Long Wait",
  "Poor Communication",
  "Needs Improvement",
  "Unprofessional",
  "Overpriced",
  "Noisy",
];

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

  // Seed FormConfig + FeedbackCategories (idempotent)
  const formConfig = await prisma.formConfig.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      brandColor: "#16a34a",
      welcomeMessage: "Thanks for visiting Spice Garden Berlin! We'd love your feedback.",
    },
    update: {},
  });

  await prisma.feedbackCategory.deleteMany({ where: { formConfigId: formConfig.id } });
  await prisma.feedbackCategory.createMany({
    data: [
      {
        formConfigId: formConfig.id,
        name: "Kitchen",
        positiveChips: ["Great Food", "Good Value"],
        negativeChips: ["Overpriced"],
        order: 0,
      },
      {
        formConfigId: formConfig.id,
        name: "Front of House",
        positiveChips: ["Great Service", "Friendly Staff", "Fast Service"],
        negativeChips: ["Long Wait", "Poor Communication", "Unprofessional"],
        order: 1,
      },
      {
        formConfigId: formConfig.id,
        name: "Atmosphere",
        positiveChips: ["Clean Environment", "Highly Recommend"],
        negativeChips: ["Noisy", "Needs Improvement"],
        order: 2,
      },
    ],
  });

  // Clear existing feedback so re-seeding is idempotent
  await prisma.anonymousFeedback.deleteMany({ where: { businessId: business.id } });

  // Seed 25 feedback rows across past 90 days
  for (const row of FEEDBACK_ROWS) {
    await prisma.anonymousFeedback.create({
      data: {
        businessId: business.id,
        rating: row.rating,
        tags: [...row.tags],
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
  console.log(`   Seeded 3 FeedbackCategory rows (Kitchen, Front of House, Atmosphere).`);
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

  // FormConfig + FeedbackCategories for aahaa
  const ahaaFormConfig = await prisma.formConfig.upsert({
    where: { businessId: ahaaBusiness.id },
    create: {
      businessId: ahaaBusiness.id,
      brandColor: "#b45309",
      welcomeMessage: "Thank you for visiting aahaa Indisches Restaurant! We'd love to hear from you.",
    },
    update: {},
  });

  await prisma.feedbackCategory.deleteMany({ where: { formConfigId: ahaaFormConfig.id } });
  await prisma.feedbackCategory.createMany({
    data: [
      {
        formConfigId: ahaaFormConfig.id,
        name: "Food",
        positiveChips: ["Delicious Food", "Authentic Taste", "Great Portions", "Good Value"],
        negativeChips: ["Bland Taste", "Overpriced", "Small Portions"],
        order: 0,
      },
      {
        formConfigId: ahaaFormConfig.id,
        name: "Service",
        positiveChips: ["Friendly Staff", "Attentive Service", "Fast Service"],
        negativeChips: ["Long Wait", "Order Mix-up", "Inattentive Staff"],
        order: 1,
      },
      {
        formConfigId: ahaaFormConfig.id,
        name: "Atmosphere",
        positiveChips: ["Nice Ambiance", "Clean Space", "Outdoor Seating"],
        negativeChips: ["Noisy", "Cramped Space"],
        order: 2,
      },
    ],
  });

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
      googlePlaceId: "0x47a85146b41ada43%3A0x5cc76a2ad85b1595",
    },
    create: {
      name: "Saravanaa Bhavan",
      googleLocationId: "saravanaa-bhavan-001",
      googlePlaceId: "0x47a85146b41ada43%3A0x5cc76a2ad85b1595",
      ownerId: user.id,
    },
  });

  const saravanaaFormConfig = await prisma.formConfig.upsert({
    where: { businessId: saravanaa.id },
    create: {
      businessId: saravanaa.id,
      brandColor: "#15803d",
      welcomeMessage: "Thank you for visiting Saravanaa Bhavan! We'd love your feedback.",
    },
    update: {},
  });

  await prisma.feedbackCategory.deleteMany({ where: { formConfigId: saravanaaFormConfig.id } });
  await prisma.feedbackCategory.createMany({
    data: [
      {
        formConfigId: saravanaaFormConfig.id,
        name: "Food",
        positiveChips: ["Authentic Taste", "Great Portions", "Good Value", "Fresh Ingredients"],
        negativeChips: ["Bland Taste", "Overpriced", "Small Portions", "Stale Food"],
        order: 0,
      },
      {
        formConfigId: saravanaaFormConfig.id,
        name: "Service",
        positiveChips: ["Friendly Staff", "Attentive Service", "Fast Service"],
        negativeChips: ["Long Wait", "Rude Staff", "Order Mix-up", "Slow Service"],
        order: 1,
      },
      {
        formConfigId: saravanaaFormConfig.id,
        name: "Atmosphere",
        positiveChips: ["Clean Space", "Nice Ambiance", "Comfortable Seating"],
        negativeChips: ["Noisy", "Cramped Space", "Dirty Tables"],
        order: 2,
      },
    ],
  });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
