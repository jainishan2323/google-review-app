# seed-import — temporary scaffolding (remove when live Google data lands)

These scripts exist **only** to give pilot businesses review data on the
Analytics dashboard while we wait for Google Business Profile API approval
(quota-gated; see CLAUDE.md). They import a pilot's own Google reviews — scraped
via Apify — as real `Review` rows, marked with a `seed:` prefix on
`googleReviewId`. See [ADR-0020](../../../../docs/adr/0020-seed-reviews-import-temporary-scaffolding.md).

**This whole folder is throwaway.** When live Google data lands, delete it.

## Scripts

The DB target is always **explicit** — pass `DATABASE_URL` so the target is
deliberate (the env divergence makes a silent default dangerous).

```bash
# Import an Apify export onto an EXISTING business (idempotent; lands analyzedAt=null).
DATABASE_URL="postgres://…" pnpm --filter @repo/db exec \
  tsx scripts/seed-import/import-seed-reviews.ts <businessId> ./export.json
# Then: open the dashboard for that business and click "Analyze" (ADR-0019).

# Purge that business's seeded reviews at cutover (dry-run without --confirm).
DATABASE_URL="postgres://…" pnpm --filter @repo/db exec \
  tsx scripts/seed-import/purge-seed-reviews.ts <businessId> --confirm

# Dev-only: load the First Indian fixture as its own dev business (analyzer testing).
pnpm --filter @repo/db exec tsx scripts/seed-import/load-first-indian.ts
```

Scraped exports (`*.json` here) are **third-party PII** and are gitignored — never commit them.

## Removal (when live Google data lands)

1. Run `purge-seed-reviews.ts <businessId> --confirm` for each pilot.
2. Set `SHOW_SAMPLE_DATA` off on the web deploy (banner disappears).
3. `rm -rf packages/db/scripts/seed-import/`, delete `apps/web/src/components/SampleDataBanner.tsx`
   and its conditional in the analytics page, drop the flag from `.env.example` + `turbo.json`.
4. `grep -rn "SEED-IMPORT"` to confirm nothing's left. No migration to unwind.
