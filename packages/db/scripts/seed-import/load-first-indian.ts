/**
 * Dev-only loader: imports the First Indian Restaurant Google-review export
 * (apps/web/src/mock/first-indian.json) into the DEV database as a new business
 * for analyzer stress-testing. Idempotent (upserts by googleReviewId / location).
 *
 * Run: pnpm --filter @repo/db exec tsx scripts/seed-import/load-first-indian.ts
 *
 * Targets the DEV DB explicitly (apps/web/.env.local → ep-weathered-unit), NOT
 * packages/db/.env (PROD).
 */
import { readFileSync } from "node:fs";

const ROOT = "/root/projects/google-review-app";

const envText = readFileSync(`${ROOT}/apps/web/.env.local`, "utf8");
const match = envText.match(/^DATABASE_URL="?(.+?)"?\s*$/m);
if (!match) throw new Error("DATABASE_URL not found in apps/web/.env.local");
process.env.DATABASE_URL = match[1];

interface RawReview {
  reviewId: string;
  stars: number;
  name: string;
  text: string | null;
  publishedAtDate: string;
  reviewerPhotoUrl: string | null;
  responseFromOwnerText: string | null;
  responseFromOwnerDate: string | null;
}

async function main() {
const { prisma, applyTaxonomyTemplate } = await import("../../src/index");

const raw: RawReview[] = JSON.parse(
  readFileSync(`${ROOT}/apps/web/src/mock/first-indian.json`, "utf8"),
);

// Dedupe by reviewId (the export repeats entries).
const byId = new Map<string, RawReview>();
for (const r of raw) if (r.reviewId && !byId.has(r.reviewId)) byId.set(r.reviewId, r);
const reviews = [...byId.values()];

const owner = await prisma.user.upsert({
  where: { email: "first-indian-dev@jugnoo.de" },
  update: {},
  create: { email: "first-indian-dev@jugnoo.de", name: "First Indian (dev)", role: "OWNER" },
});

const business = await prisma.business.upsert({
  where: { googleLocationId: "dev/first-indian-restaurant" },
  update: {},
  create: {
    name: "First Indian Restaurant",
    businessType: "restaurant",
    googleLocationId: "dev/first-indian-restaurant",
    googlePlaceId: "ChIJXe4RwEJRqEcRTZ5x57Vxvsc",
    googleMapsReviewUrl:
      "https://www.google.com/maps/search/?api=1&query=First%20Indian%20Restaurant&query_place_id=ChIJXe4RwEJRqEcRTZ5x57Vxvsc",
    ownerId: owner.id,
  },
});

// Seed the restaurant taxonomy so the analyzer has zones/tags to map onto (no-op if a FormConfig exists).
const tax = await prisma.$transaction((tx) =>
  applyTaxonomyTemplate(tx, business.id, "restaurant"),
);

let upserted = 0;
for (const r of reviews) {
  const text = (r.text ?? "").replace(/<br\s*\/?>/gi, "\n").trim();
  const hasReply = !!r.responseFromOwnerText;

  await prisma.review.upsert({
    where: { googleReviewId: `fi-${r.reviewId}` },
    update: {},
    create: {
      businessId: business.id,
      googleReviewId: `fi-${r.reviewId}`,
      authorName: r.name?.trim() || "Anonymous",
      authorPhoto: r.reviewerPhotoUrl ?? null,
      rating: r.stars,
      text: text.length > 0 ? text : null,
      publishedAt: new Date(r.publishedAtDate),
      isReplied: hasReply,
      replyText: r.responseFromOwnerText ?? null,
      repliedAt: r.responseFromOwnerDate ? new Date(r.responseFromOwnerDate) : null,
    },
  });
  upserted++;
}

console.log(
  `✅ ${business.name} (${business.id})\n` +
    `   owner: ${owner.email}\n` +
    `   taxonomy applied: ${tax.applied}\n` +
    `   reviews upserted: ${upserted} (deduped from ${raw.length} raw)`,
);

await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
