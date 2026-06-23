/**
 * SEED-IMPORT (temporary scaffolding — remove when live Google data lands; see ADR-0020)
 *
 * Deletes a business's SEEDED reviews at cutover (when live Google data lands).
 * Double-scoped — `businessId` AND the `seed:` prefix — so it cannot touch real
 * or other-business rows. Leaves `AnonymousFeedback` (real private feedback)
 * untouched. Dry-run by default; pass --confirm to actually delete.
 *
 * Cutover order matters: purge FIRST, THEN flip `SHOW_SAMPLE_DATA` off on web.
 *
 * Usage (DB target is REQUIRED and explicit):
 *
 *   DATABASE_URL="postgres://…" pnpm --filter @repo/db exec \
 *     tsx scripts/seed-import/purge-seed-reviews.ts <businessId> [--confirm]
 */
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
  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");
  const businessId = args.find((a) => !a.startsWith("--"));

  if (!process.env.DATABASE_URL) {
    fail(
      "DATABASE_URL is not set. Pass it explicitly so the target DB is deliberate, e.g.\n" +
        '  DATABASE_URL="postgres://…" tsx scripts/seed-import/purge-seed-reviews.ts <businessId> --confirm',
    );
  }
  if (!businessId) {
    fail("Usage: tsx scripts/seed-import/purge-seed-reviews.ts <businessId> [--confirm]");
  }

  console.log(`→ target DB host: ${dbHost(process.env.DATABASE_URL)}`);

  const { prisma } = await import("../../src/index");

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) fail(`No business with id "${businessId}" in this DB.`);

  // Both clauses always — structurally cannot hit real or other-business rows.
  const where = { businessId: business.id, googleReviewId: { startsWith: "seed:" } };
  const count = await prisma.review.count({ where });

  if (count === 0) {
    console.log(`→ ${business.name}: no seeded reviews to purge.`);
    await prisma.$disconnect();
    return;
  }

  if (!confirm) {
    console.log(
      `→ ${business.name}: would delete ${count} seeded reviews. ` +
        `Re-run with --confirm to execute. (AnonymousFeedback is never touched.)`,
    );
    await prisma.$disconnect();
    return;
  }

  const { count: deleted } = await prisma.review.deleteMany({ where });
  console.log(`✅ purged ${deleted} seeded reviews from ${business.name}.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
