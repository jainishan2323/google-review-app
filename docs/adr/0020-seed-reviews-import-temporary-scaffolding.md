# Seed-reviews import is two throwaway scripts, not a Lantern feature

While we wait for Google Business Profile API approval (weeks out, quota-gated — see CLAUDE.md), pilot businesses have **no review data**, so the already-built Analytics dashboard (operational zones, sentiment, unmapped insights, volume-over-time) has nothing to show. To bridge that gap we scrape a pilot's existing Google reviews via Apify and **import the raw JSON export into the pilot's business as real `Review` rows**. The dashboard then works unchanged. When live Google data lands, the seeded rows are purged and replaced.

This is deliberately a **stopgap**, sized to actual pilot scale: **one operator, who is also the developer, with repo + DB access.** It is therefore built as **two `tsx` scripts plus one web feature flag** — not a Lantern UI, server action, or operator panel. There is no non-technical operator to self-serve, so there is nothing to build a UI for. Removal is `rm` of two files.

## Decisions

**Import to real `Review` rows, not a blob.** The imported JSON becomes ordinary `Review` records, so the entire analytics stack — the batch analyzer, the analytics page, `/api/feedback-by-tag`, `/api/feedback-by-month`, drill-downs, generate-reply — reads them with **zero changes**. Seeded reviews land **unanalyzed** (`analyzedAt = null`).

**Two scripts, not a Lantern UI.** The earlier draft of this ADR specified a paste `<textarea>` + server action + `SEED_IMPORT_ENABLED` flag + `SeedReviewsPanel` in Lantern. All of that machinery existed to let a *non-technical operator* self-serve. At pilot scale that operator doesn't exist — the operator is the developer. So:
- `packages/db/scripts/seed-import/import-seed-reviews.ts <businessId> <file.json>` — validate + upsert reviews onto an **existing** business.
- `packages/db/scripts/seed-import/purge-seed-reviews.ts <businessId>` — delete that business's seeded reviews at cutover.

These are siblings to the proven `load-first-indian.ts` loader. No flag gates them — a `tsx` script is not an exposed surface, so there is nothing to disable. No Lantern code is touched at all.

**Zero schema changes; the marker is a `seed:` prefix on `googleReviewId`** (a value, not a column). It gives idempotent upserts and a way to scope the purge. With the cutover now gated by an explicit flag (below) rather than by data provenance, a `Review.source` column would only buy purge safety — and the purge is already double-scoped (`businessId` **and** `seed:` prefix) over a business that has *only* seeded reviews until live data exists. So the column isn't worth a migration here.

**Import targets an existing business and demands an explicit DB.** Unlike `load-first-indian.ts` (which mints its own dev business and auto-reads `apps/web/.env.local`), the import script:
- takes an **existing** `businessId` (pilots are pre-provisioned in Lantern) and fails loudly if it doesn't exist — it never creates a business;
- **requires `DATABASE_URL` to be passed explicitly** and prints the target host before writing. It will not silently default to a `.env` file. This is the one real footgun given the known PROD/DEV env divergence (`packages/db/.env` = PROD) — the target is deliberate and reviewable in the command, not implicit.

**Validate, skip-and-report.** Each row requires `reviewId`, `stars` (int 1–5), `name`, `publishedAtDate`; `text` optional. Bad rows are skipped and counted back, not fatal — Apify exports are messy. Lightweight manual validation (no Zod) keeps `@repo/db` dependency-free.

**Idempotent + deduped.** Upsert keyed on `googleReviewId = \`seed:\${reviewId}\``; duplicate `reviewId`s within one import are collapsed. Re-running on a superset is safe. (Upsert `update` is a no-op like the loader — re-import adds, it does not rewrite existing rows.)

**Field mapping:** `publishedAtDate → publishedAt`, `name → authorName`, `reviewerPhotoUrl → authorPhoto`, `stars → rating`, `text/textTranslated → text`, owner-response fields → `replyText`/`repliedAt`/`isReplied`. (Mirrors `load-first-indian.ts`.)

**Analysis reuses the dashboard, not the script.** Seeded rows land `analyzedAt = null`; the operator opens the dashboard for that business and clicks **"Analyze"** — the existing client-driven analyzer (ADR-0019). We deliberately do **not** fork the analyzer's taxonomy-mapping logic into the script: doing so would duplicate non-trivial production logic and add a backwards `db → llm` dependency edge, both for throwaway code. The operator is opening the dashboard to demo the data anyway, so "import, then click Analyze" is one extra click on a path they're already on.

**Sample-data banner is gated by one global flag, not connection state.** A server-side flag on the **web** app (`SHOW_SAMPLE_DATA`, not `NEXT_PUBLIC_`) controls whether the Analytics page shows *"Showing imported sample reviews — connect your Google Business Profile to bring in your own."* A **global** flag matches reality: Google approval is a **project-wide event**, not per-business, so all pilots flip from sample to live together. This is why the banner is *not* keyed off per-business connection state (the earlier draft's approach): connection state decouples from data replacement and would show seeded reviews as real in the gap before purge.

**Cutover is purge-then-flag-off, and order matters.** The flag only controls the banner; the analytics page reads `Review` rows either way. So flipping the flag off while seeded rows remain would present scraped reviews as real with no banner. The runbook is fixed: **live data lands → run `seed-import/purge-seed-reviews.ts` → then flip `SHOW_SAMPLE_DATA` off.** Never the reverse. Both steps are by hand, by the same operator — acceptable at pilot scale.

**Purge is double-scoped and dry-run by default.** `deleteMany` where `businessId = X` **and** `googleReviewId` starts with `seed:` — both clauses always, so it is structurally incapable of touching real or other-business rows. It **leaves `AnonymousFeedback` untouched** (private form feedback is real pilot data). The script prints the count it *would* delete and only executes with an explicit `--confirm`.

**Reviews/reply dashboard stays out of scope — analytics only.** Owners can *generate* draft replies but can't *post* them until Phase 2, so a reviews tab would be half-functional. We ship the analytics value now.

## Removability

- **No flag to remove on the import path** (scripts aren't gated). The only flag is `SHOW_SAMPLE_DATA` on web, plus a small banner component + one conditional in the analytics page.
- **Physical isolation:** all scripts live under one throwaway folder, `packages/db/scripts/seed-import/` (with its own README), and one banner component on web. Teardown: `rm -rf packages/db/scripts/seed-import/`, delete the banner component + its conditional, drop the flag. **No migration to unwind** (zero schema changes).
- **Grep-able marker** on the web touch-points (banner + conditional): `// SEED-IMPORT (temporary scaffolding — remove when live Google data lands; see ADR-0020)`. The scripts are self-evidently temporary by name + location.

## Consequences / revisit

- Seeded reviews are third-party PII (real names, reviewer photo URLs) for data subjects who never consented. They must live only in the DB you target with the explicit `DATABASE_URL`, and the scraped JSON is never committed (keep it out of git, same as the local fixtures). Given the German market, treat retention as bounded by the cutover purge — do not let seeded PII outlive the pilot.
- No bulk/multi-business import; one script run per business, by hand. Fine at pilot scale.
- If pilots gain a non-technical operator, or we want auto-purge tied to a real Google sync, or bulk import, revisit — at that point the feature has earned promotion out of "scaffolding," and a Lantern UI + a `source` column can be reconsidered.
