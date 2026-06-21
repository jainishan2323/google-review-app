# Sample-data enrich — operator runbook (ADR-0020)

How to seed a pilot business's analytics with its **own** Google reviews (scraped
via Apify) while we wait for Google Business Profile API approval, how to
show/hide the "sample data" experience, and how to purge it at cutover.

> Background + rationale: [docs/adr/0020-seed-reviews-import-temporary-scaffolding.md](adr/0020-seed-reviews-import-temporary-scaffolding.md)
> · scripts + README: `packages/db/scripts/seed-import/`

## Prerequisites (read once)

- **The scaffolding must be on the deployed code.** It lives on branch
  `feat/seed-reviews-import-scaffolding` (scripts under
  `packages/db/scripts/seed-import/`, the banner, the `SHOW_SAMPLE_DATA` flag).
  Merge it to `main` / deploy it before following this runbook. Locally:
  `git checkout feat/seed-reviews-import-scaffolding` (or `main` once merged).
- **Prod DB.** Production is the Neon `ep-wild-dust` instance whose `DATABASE_URL`
  is in `packages/db/.env`. The import/purge scripts **require `DATABASE_URL` to be
  passed explicitly** — they never read a `.env` — so prod vs dev is always a
  deliberate choice in the command.
- **These are real people's names + photos (PII).** The scraped JSON is gitignored;
  never commit it. Keep it local.

Throughout, set the prod URL once per shell so you don't paste it repeatedly:

```bash
# Pull the prod connection string from packages/db/.env into this shell only.
export PROD_DATABASE_URL="$(grep -E '^DATABASE_URL=' packages/db/.env | sed -E 's/^DATABASE_URL=//; s/^"//; s/"$//')"
# Sanity check — should print the ep-wild-dust host:
node -e 'console.log(new URL(process.env.PROD_DATABASE_URL).host)' PROD_DATABASE_URL="$PROD_DATABASE_URL"
```

---

## A. Add sample data for a business (prod)

### 1. Get the target `businessId` from prod

The business must already be provisioned in Lantern. Find its id by either:

- **Prisma Studio:** `cd packages/db && pnpm db:studio` (uses `packages/db/.env` → prod) → open `Business` → copy the `id`, **or**
- **Lantern:** `/dashboard/businesses` → the business detail page.

### 2. Scrape the reviews via Apify

Run your Google-reviews Apify actor for that business and **download the run's
dataset as JSON** (an array). The import needs at least these fields per row
(extra fields are ignored):

| field | required | maps to |
|-------|----------|---------|
| `reviewId` | ✅ | dedupe key → `seed:<reviewId>` |
| `stars` (int 1–5) | ✅ | `rating` |
| `name` | ✅ | `authorName` |
| `publishedAtDate` (ISO) | ✅ | `publishedAt` |
| `text` / `textTranslated` | optional | `text` |
| `reviewerPhotoUrl` | optional | `authorPhoto` |
| `responseFromOwnerText` / `responseFromOwnerDate` | optional | `replyText` / `repliedAt` / `isReplied` |

Save it somewhere local, e.g. `~/exports/<business>-reviews.json`. **Do not** put
it in the repo (anything in `packages/db/scripts/seed-import/*.json` is gitignored,
but keeping it outside the repo entirely is safest).

### 3. Import into prod

```bash
DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter @repo/db exec \
  tsx scripts/seed-import/import-seed-reviews.ts <businessId> ~/exports/<business>-reviews.json
```

- The script prints the **target DB host** before writing — confirm it's
  `ep-wild-dust…` (prod).
- It validates rows (skip-and-report), dedupes, and upserts on the `seed:` prefix.
  Re-running with a superset is safe (idempotent).
- Imported rows land **unanalyzed** (`analyzedAt = null`) — analytics panels are
  still blank until step 4.

### 4. Analyze the imported reviews (populates the dashboard)

Seeded rows have no tags/sentiment yet. Run the **existing** analyzer from the UI:

1. Sign in to the dashboard as an Operator (or the business owner).
2. As Operator, switch the active business to the target business.
3. Open **Analytics** → click **"Analyze"** (the ADR-0019 client-driven run).
   Leave the tab open until it completes (progress survives in-app navigation,
   not a hard reload).
4. Panels (sentiment, operational zones, unmapped insights) now populate.

### 5. Turn on the "sample data" banner

See section B — set `SHOW_SAMPLE_DATA=true` so the dashboard honestly labels the
imported reviews.

---

## B. Enable / disable the feature (the banner)

The honest "Showing imported sample reviews…" banner is gated by a **server-side**
flag on the **web** app, `SHOW_SAMPLE_DATA`. It is global (Google approval is
project-wide, so all pilots flip together).

> Dependency: the Analytics page itself only renders when `NEXT_PUBLIC_ANALYTICS="true"`.
> If analytics is still showing "coming soon", enable that first (same web project),
> otherwise there's nowhere for the banner or data to appear.

### Enable

1. In **Vercel → the `web` project → Settings → Environment Variables**, set
   `SHOW_SAMPLE_DATA = true` (Production scope). Ensure `NEXT_PUBLIC_ANALYTICS = true` too.
2. **Redeploy** the web project (env changes require a redeploy — there's no
   runtime toggle).
3. Verify: open the dashboard Analytics page → the banner appears above the stats.

### Disable

1. Set `SHOW_SAMPLE_DATA = false` (or remove it) on the `web` project.
2. **Redeploy.**
3. Banner disappears. (Disabling the banner does **not** remove the data — purge
   separately, section C.)

**Local testing:** add `SHOW_SAMPLE_DATA="true"` to `apps/web/.env.local` and
restart `pnpm --filter @repo/web dev`.

---

## C. Purge seeded reviews from the DB (cutover)

Do this when live Google data is about to replace the sample data. **Order matters:
purge first, then turn the banner off (section B).** Flipping the banner off while
seeded rows remain would show scraped reviews as if they were real.

### 1. Dry run (no deletion — shows the count it *would* delete)

```bash
DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter @repo/db exec \
  tsx scripts/seed-import/purge-seed-reviews.ts <businessId>
```

Confirm the printed host is prod and the count looks right.

### 2. Execute

```bash
DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter @repo/db exec \
  tsx scripts/seed-import/purge-seed-reviews.ts <businessId> --confirm
```

- Deletes **only** `Review` rows that are both this `businessId` **and**
  `seed:`-prefixed — structurally cannot touch real or other-business rows.
- **Leaves `AnonymousFeedback` untouched** (real private form feedback is never seeded).

### 3. Turn the banner off

Follow section B → Disable.

---

## Quick reference

| Goal | Command / action |
|------|------------------|
| Find businessId | `cd packages/db && pnpm db:studio` (prod) → Business |
| Import (prod) | `DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter @repo/db exec tsx scripts/seed-import/import-seed-reviews.ts <id> <file.json>` |
| Analyze | Dashboard → Analytics → **Analyze** button |
| Show banner | Vercel `web`: `SHOW_SAMPLE_DATA=true` (+ `NEXT_PUBLIC_ANALYTICS=true`) → redeploy |
| Hide banner | Vercel `web`: `SHOW_SAMPLE_DATA=false` → redeploy |
| Purge (dry run) | `DATABASE_URL="$PROD_DATABASE_URL" … purge-seed-reviews.ts <id>` |
| Purge (execute) | `… purge-seed-reviews.ts <id> --confirm` |

Full teardown of the whole scaffolding (when it's gone for good) is tracked in
GitHub issue **#25**.
