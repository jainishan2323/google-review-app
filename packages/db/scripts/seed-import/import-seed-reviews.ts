/**
 * SEED-IMPORT (temporary scaffolding — remove when live Google data lands; see ADR-0020)
 *
 * Imports an Apify Google-reviews JSON export into an EXISTING business as real
 * `Review` rows, so the Analytics dashboard has data while we wait for Google
 * Business Profile API approval. Idempotent: upserts keyed on a `seed:` prefix.
 *
 * Seeded rows land UN-analyzed (`analyzedAt = null`). After importing, open the
 * dashboard for this business and click "Analyze" (the existing ADR-0019 flow).
 *
 * Usage (DB target is REQUIRED and explicit — never auto-read from a .env):
 *
 *   DATABASE_URL="postgres://…" pnpm --filter @repo/db exec \
 *     tsx scripts/seed-import/import-seed-reviews.ts <businessId> <path/to/export.json>
 *
 * The scraped JSON contains third-party PII (names, photo URLs) — never commit it.
 */
import { readFileSync } from "node:fs";

interface RawReview {
  reviewId?: string;
  stars?: number;
  name?: string;
  text?: string | null;
  textTranslated?: string | null;
  publishedAtDate?: string;
  reviewerPhotoUrl?: string | null;
  responseFromOwnerText?: string | null;
  responseFromOwnerDate?: string | null;
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function dbHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable)";
  }
}

async function main() {
  const [businessId, filePath] = process.argv.slice(2);

  if (!process.env.DATABASE_URL) {
    fail(
      "DATABASE_URL is not set. Pass it explicitly so the target DB is deliberate, e.g.\n" +
        '  DATABASE_URL="postgres://…" tsx scripts/seed-import/import-seed-reviews.ts <businessId> <file.json>',
    );
  }
  if (!businessId || !filePath) {
    fail("Usage: tsx scripts/seed-import/import-seed-reviews.ts <businessId> <path/to/export.json>");
  }

  console.log(`→ target DB host: ${dbHost(process.env.DATABASE_URL)}`);

  const { prisma } = await import("../../src/index");

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) {
    fail(`No business with id "${businessId}" in this DB. Provision it in Lantern first.`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    fail(`Could not read/parse ${filePath}: ${(e as Error).message}`);
  }
  if (!Array.isArray(raw)) {
    fail("Export must be a JSON array of review objects.");
  }
  const rows = raw as RawReview[];

  // Validate, skip-and-report. Dedupe by reviewId (Apify exports repeat entries).
  const byId = new Map<string, RawReview>();
  let skipped = 0;
  const skipReasons: Record<string, number> = {};
  const skip = (reason: string) => {
    skipped++;
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
  };

  for (const r of rows) {
    if (!r || typeof r.reviewId !== "string" || r.reviewId.length === 0) {
      skip("missing reviewId");
      continue;
    }
    if (typeof r.stars !== "number" || !Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) {
      skip("bad stars (need int 1–5)");
      continue;
    }
    if (typeof r.name !== "string" || r.name.trim().length === 0) {
      skip("missing name");
      continue;
    }
    if (typeof r.publishedAtDate !== "string" || Number.isNaN(Date.parse(r.publishedAtDate))) {
      skip("missing/invalid publishedAtDate");
      continue;
    }
    if (!byId.has(r.reviewId)) byId.set(r.reviewId, r);
  }

  const reviews = [...byId.values()];
  console.log(
    `→ ${business.name} (${business.id}): ${reviews.length} valid, ` +
      `${skipped} skipped, from ${rows.length} raw rows.`,
  );
  if (skipped > 0) {
    for (const [reason, n] of Object.entries(skipReasons)) console.log(`    skipped ${n}: ${reason}`);
  }
  if (reviews.length === 0) fail("Nothing to import.");

  let upserted = 0;
  for (const r of reviews) {
    const body = (r.textTranslated ?? r.text ?? "").replace(/<br\s*\/?>/gi, "\n").trim();
    const hasReply = !!r.responseFromOwnerText;

    await prisma.review.upsert({
      where: { googleReviewId: `seed:${r.reviewId}` },
      update: {}, // no-op: re-import adds new rows, never rewrites existing ones
      create: {
        businessId: business.id,
        googleReviewId: `seed:${r.reviewId}`,
        authorName: r.name!.trim() || "Anonymous",
        authorPhoto: r.reviewerPhotoUrl ?? null,
        rating: r.stars!,
        text: body.length > 0 ? body : null,
        publishedAt: new Date(r.publishedAtDate!),
        isReplied: hasReply,
        replyText: r.responseFromOwnerText ?? null,
        repliedAt: r.responseFromOwnerDate ? new Date(r.responseFromOwnerDate) : null,
      },
    });
    upserted++;
  }

  console.log(
    `✅ imported ${upserted} seeded reviews (analyzedAt = null).\n` +
      `   Next: open the dashboard for this business and click "Analyze".`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
