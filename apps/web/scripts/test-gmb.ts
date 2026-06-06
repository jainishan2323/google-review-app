/**
 * Read-only local harness to exercise the Google Business Profile API with a real
 * restaurant owner's credentials captured at login.
 *
 * Usage (from repo root or apps/web):
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=... \
 *     npx tsx apps/web/scripts/test-gmb.ts
 *
 * Get GOOGLE_REFRESH_TOKEN by having the owner log in on prod (DEV_TOKEN_CAPTURE=true)
 * and copying it from /api/dev/token. This script performs NO writes — it lists the
 * owner's accounts + locations and fetches their real reviews.
 *
 * A 403 / PERMISSION_DENIED here almost always means the Cloud project hasn't been
 * granted Business Profile API access (default quota is 0), not a bad token.
 */
import {
  refreshAccessToken,
  listAccounts,
  listLocations,
  fetchReviews,
} from "../src/lib/google-business";

async function main() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    console.error("Missing GOOGLE_REFRESH_TOKEN env var.");
    process.exit(1);
  }

  console.log("→ Refreshing access token…");
  const { accessToken, expiresAt } = await refreshAccessToken(refreshToken);
  console.log(`  ✓ access token (expires ${new Date(expiresAt * 1000).toISOString()})\n`);

  console.log("→ Listing accounts…");
  const accounts = await listAccounts(accessToken);
  console.log(`  ✓ ${accounts.length} account(s):`);
  for (const a of accounts) console.log(`    - ${a.name} ${a.accountName ?? ""} (${a.type ?? "?"})`);
  console.log();

  if (accounts.length === 0) {
    console.log("No accounts visible to this token. Stopping.");
    return;
  }

  for (const account of accounts) {
    console.log(`→ Listing locations for ${account.name}…`);
    const locations = await listLocations(accessToken, account.name);
    console.log(`  ✓ ${locations.length} location(s):`);
    for (const loc of locations) console.log(`    - ${loc.name} — ${loc.title ?? "(untitled)"}`);
    console.log();

    for (const loc of locations) {
      // v4 reviews resource = accounts/{accId}/locations/{locId}
      const locationName = `${account.name}/${loc.name}`;
      console.log(`→ Fetching reviews for ${locationName} (${loc.title ?? "?"})…`);
      try {
        const reviews = await fetchReviews(accessToken, locationName);
        console.log(`  ✓ ${reviews.length} review(s):`);
        for (const r of reviews.slice(0, 10)) {
          const stars = r.starRating;
          const comment = r.comment ? r.comment.replace(/\s+/g, " ").slice(0, 120) : "(no text)";
          console.log(`    [${stars}] ${r.reviewer.displayName}: ${comment}`);
        }
        if (reviews.length > 10) console.log(`    …and ${reviews.length - 10} more`);
      } catch (err) {
        console.error(`  ✗ ${(err as Error).message}`);
      }
      console.log();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
