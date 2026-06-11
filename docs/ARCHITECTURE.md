# Architecture

A planning map for reasoning about changes without the whole codebase open. For commands, env var names, and conventions, see [/CLAUDE.md](../CLAUDE.md).

> Describes `main` as it stands today (dashboard reads a hardcoded `DEV_BUSINESS_ID` from Postgres). The "fetch real Google reviews per signed-in user" work lives on branch `feat/live-google-business-data` and is not reflected here except where noted.

## 1. Overview

**Jugnoo** helps local businesses grow and manage their Google reputation. It has three surfaces backed by one shared database:

1. **Customer review funnel** (`apps/form`) — a customer scans a QR code, lands on a per-business form, rates their visit, and picks descriptive chips. An LLM turns that into a polished review. **Happy customers (rating ≥4)** get the draft + a one-tap redirect to Google's write-review page; **unhappy customers (<4)** are routed into *private* feedback that never reaches Google. This "review gating" both lifts the public rating and captures problems privately.
2. **Owner dashboard** (`apps/web`) — the business owner signs in with Google, sees their reviews and private feedback, drafts AI replies, and reads analytics produced by a batch sentiment/taxonomy analyzer. Owners also configure the form (branding, chip taxonomy) and generate QR codes here.
3. **Marketing + admin** — `apps/landing` is the public site + waitlist; `apps/lantern` is an internal admin console (businesses, waitlist, app feedback) gated to allowlisted emails.

Shared logic is factored into packages: **`@repo/db`** (Prisma/Postgres), **`@repo/llm`** (provider-abstracted AI), **`@repo/types`** (domain interfaces + taxonomy types), **`@repo/ui`** (a few shared primitives).

```
┌─────────────┐   QR    ┌──────────────┐  AI review   ┌──────────┐
│  Customer   │────────▶│  apps/form   │─────────────▶│  Google  │  (rating ≥4)
└─────────────┘         │   (:3001)    │              └──────────┘
                        │              │── private feedback (rating <4) ─┐
                        └──────────────┘                                 ▼
┌─────────────┐  Google ┌──────────────┐                          ┌───────────┐
│   Owner     │  OAuth  │  apps/web    │◀────── reads/writes ─────▶│ Postgres  │
│             │────────▶│   (:3000)    │   reviews, feedback,      │ (@repo/db)│
└─────────────┘         │  dashboard   │   analytics, config       └───────────┘
                        └──────────────┘                                 ▲
┌─────────────┐         ┌──────────────┐                                 │
│   Admin     │────────▶│ apps/lantern │──────────── reads ──────────────┘
└─────────────┘         │   (:3003)    │
                        └──────────────┘
        apps/landing (:3002) — marketing site + waitlist (writes WaitlistEntry)
```

## 2. Repository layout

```
google-review-app/
├── apps/
│   ├── web/         Owner dashboard (Next.js, :3000) — auth + reviews + analytics
│   ├── form/        Customer review funnel (Next.js, :3001) — public, per-business
│   ├── landing/     Marketing site + waitlist (Next.js, :3002)
│   └── lantern/     Internal admin console (Next.js, :3003)
├── packages/
│   ├── db/          Prisma schema, client singleton, seed
│   ├── llm/         Provider-abstracted LLM helpers (OpenAI today)
│   ├── types/       Shared TS interfaces + taxonomy/analysis types
│   └── ui/          Shared React primitives (button/card/star-rating)
├── turbo.json       Task graph + the env vars each build receives
└── pnpm-workspace.yaml
```

### apps/web — owner dashboard
- `src/app/dashboard/` — pages: `page.tsx` (overview/stats), `reviews/`, `analytics/`, `feedback/` (private feedback) and `feedback/settings/` (form config + QR), `settings/`. `layout.tsx` renders the sidebar/header.
- `src/app/api/` — route handlers: `reviews/[reviewId]/reply` (post reply to Google), `generate-reply` (AI draft), `alerts` (alert-config CRUD), `feedback*` and `analytics/sentiment` (data for charts), `auth/[...nextauth]`.
- `src/app/actions/analyzeReviews.ts` + `src/actions/` — server actions (batch analysis, form-config upsert, feedback submit).
- `src/lib/auth.ts` — NextAuth Google config (requests `business.manage` scope, stores tokens in the JWT). `src/lib/google-business.ts` — thin wrapper over the Google Business Profile **v4** API (`fetchReviews`, `postReply`). `src/lib/mock-data.ts` — sample data.
- `src/middleware.ts` — guards `/dashboard/*` with NextAuth.

### apps/form — customer funnel
- `src/app/[businessId]/page.tsx` — server component; loads business + form config via `src/lib/form-data.ts`, streams `ReviewForm` behind a skeleton.
- `src/components/ReviewForm.tsx` — the whole interactive flow (rating → chips → AI generate → copy/redirect or private submit).
- `src/app/api/` — `generate` (LLM review text, optional streaming), `submit` (basic anonymous feedback), `submit-private` (private/`google_redirect` feedback with tag classification), `app-feedback` (emoji rating of the product itself).
- `src/lib/place-id.ts` — normalizes Google Place IDs for the write-review URL.

### apps/lantern — admin
- `src/app/dashboard/` — `businesses/`, `waitlist/`, `app-feedback/` views. `src/lib/auth.ts` gates sign-in to `ADMIN_EMAILS`.
- `src/actions/businesses.ts` — operator onboarding: creates the owner + `Business` and seeds its form from the Business Type's Taxonomy Template (`applyTaxonomyTemplate`) in one transaction. `reseedTaxonomy` re-seeds businesses that have no form.

### apps/landing — marketing
- `src/app/page.tsx` + components (`WaitlistForm`, `ScreenshotCarousel`, `CookieBanner`), legal pages (`impressum`, `privacy`, `terms`), `robots.ts`, `sitemap.ts`. No DB/auth dependency beyond the waitlist write.

### packages
- **db** — `prisma/schema.prisma` (Postgres), `prisma/migrations/`, `prisma/seed.ts`, `src/taxonomy-templates.ts` (code-defined Taxonomy Templates per Business Type + `applyTaxonomyTemplate`), and `src/index.ts` exporting the `prisma` singleton + all Prisma types + the template helpers.
- **llm** — `client.ts` (`getLLMClient()` picks a provider by `LLM_PROVIDER`), `providers/openai.ts` + `providers/types.ts` (the `LLMProvider` interface: `complete` / `stream`), and feature helpers: `review-generator.ts`, `review-analyzer.ts`, `sentiment-analyzer.ts`, `reply-drafter.ts`, `label-translator.ts` (batched chip-label translation for fill-blanks auto-translate). `index.ts` is the public surface.
- **types** — `src/index.ts`: form/review/business/feedback interfaces, the analyzer taxonomy types (`TaxonomyCategory`, `MappedTag`, `ReviewAnalysisResult`, …), and the multilingual-tag helpers (`resolveLabel` fallback chain, `FormTag`, `LabelMap`, `Polarity`).
- **ui** — `button.tsx`, `card.tsx`, `star-rating.tsx`.

## 3. Core request flows

### A. Customer leaves feedback (the funnel)
1. Customer opens `https://<form-host>/<businessId>` (from a QR code). `apps/form/src/app/[businessId]/page.tsx` calls `getFormData(businessId)` → `Business` + `FormConfig` + active `Tag`s grouped by `FeedbackCategory`, with each label **resolved to the business `defaultLanguage`** via `resolveLabel`.
2. `ReviewForm` shows the welcome/branding and a star rating. The chip set shown is driven by tag **polarity**: **≥4 → positive tags ("What did you love?")**, **<4 → all tags ("What can we improve?")**.
3. On generate, the client POSTs `{ businessId, rating, tagIds, customText, attempt }` (tag **identities**) to `apps/form/.../api/generate`. The route Zod-validates, resolves the ids → labels in the default language, and calls `generateReviewText` with a "write in {language}" instruction (or `streamReviewText` if `AI_STREAMING=true`) from `@repo/llm`.
4. **Rating ≥4:** the generated review is shown; the customer copies it and is sent to `https://search.google.com/local/writereview?placeid=…` (Place ID from the business, normalized by `place-id.ts`). The action is also recorded via `submit-private` with `source: "google_redirect"`.
5. **Rating <4:** the customer's selection (tag **identities**) is POSTed to `api/submit-private` and stored as `AnonymousFeedback` (`source: "private"`); `negativeTags` is derived from each selected tag's **polarity** (by identity), not by string-matching. Nothing goes to Google.

### B. Owner reviews data + AI analysis
1. Owner hits `apps/web`; `/` redirects to `/dashboard`; `middleware.ts` requires a NextAuth Google session (`src/lib/auth.ts`).
2. Dashboard pages query Postgres for the business identified by `DEV_BUSINESS_ID` (on `main`) — reviews, private feedback, and aggregates for the stat cards/charts.
3. **Replying:** owner clicks draft → `api/generate-reply` calls `draftReply` (`@repo/llm`). Posting a reply → `api/reviews/[reviewId]/reply` → `postReply` in `google-business.ts` writes to the Google Business Profile API and flips `isReplied` in the DB.
4. **Batch analysis:** `analyzeBatchOnce(businessId)` (`src/app/actions/analyzeReviews.ts`) pulls up to 15 un-analyzed reviews/feedback, builds a `TaxonomyCategory[]` from the active tags' **default-language labels**, and calls `analyzeBatch` (`@repo/llm`). The analyzer returns labels; the action maps them **back to tag identities** before writing `tags` / `negativeTags` / `unmappedInsights` and stamping `analyzedAt`. It's **idempotent** (the WHERE clause excludes already-analyzed rows) so the client loops it to completion. Analytics pages read those identities and resolve id→label for display.

## 4. Entry points & boot

- Every app is a standard Next.js App Router app: `src/app/layout.tsx` (root shell, providers) + route segments. `next dev --port N` per app; `pnpm dev` runs all four via Turborepo.
- **web:** `src/app/page.tsx` redirects `/` → `/dashboard`; `/dashboard/*` is auth-guarded by `src/middleware.ts`. Session/token wiring is in `src/lib/auth.ts` and surfaced via `src/components/providers.tsx`.
- **form:** entry is the dynamic `src/app/[businessId]/page.tsx`; the root `page.tsx` is a placeholder. No auth (public).
- **lantern:** `/` and `/dashboard/*` require a Google session restricted to `ADMIN_EMAILS` (`src/lib/auth.ts` + `src/middleware.ts`).
- **landing:** static-ish marketing pages from `src/app/page.tsx`.

## 5. Data model (Prisma / Postgres)

Defined in `packages/db/prisma/schema.prisma`. Central entity is **`Business`** (one per location); most other rows hang off it.

- **User** — owner/admin (`role`); owns `Business[]`.
- **Business** — `businessType` (vertical → picks the Taxonomy Template at onboarding), `googleLocationId` (unique), `googlePlaceId`, `googleMapsReviewUrl`, OAuth tokens; relations to reviews, feedback, alerts, QR codes, form config.
- **Review** — a Google review (`googleReviewId` unique, `rating`, `text`, reply fields) plus analyzer output (`tags`, `negativeTags`, `unmappedInsights`, `analyzedAt`). `tags`/`negativeTags` are `String[]` of **tag identities**, not wording.
- **AnonymousFeedback** — private/funnel feedback (`rating`, `text`, `generatedReview`, `tags` = tag identities, `source` = `private` | `google_redirect`, `status`, `photos`, analyzer fields).
- **FormConfig** — per-business form branding + `defaultLanguage` + `supportedLanguages`; owns `FeedbackCategory[]`.
- **FeedbackCategory** + **Tag** — the **taxonomy**. A category ("zone") owns `Tag` rows; both carry per-language `labels` (JSON) and an optional `canonicalKey`. A `Tag` has a stable identity (`id`), fixed `polarity`, `active` flag, `source` (`template`/`custom`/`insight`), and `authoredLanguage`. Identity is what's stored on feedback; labels are display-only. See ADR-0005.
- **AlertConfig** — `NEW_REVIEW` / `RATING_DROP` alert prefs per business (email send not yet wired).
- **QrCode**, **WaitlistEntry** (landing), **AppFeedback** (product-level emoji rating).

## 6. External integrations

- **PostgreSQL** via Prisma (`@repo/db`, `DATABASE_URL`) — the single source of truth shared by all apps.
- **OpenAI** via `@repo/llm` (`OPENAI_API_KEY`, `LLM_PROVIDER`) — review generation (form), reply drafting + sentiment/taxonomy analysis (web). Provider is abstracted behind `LLMProvider`; feature code never imports the SDK directly, so swapping providers is a one-file change in `client.ts`.
- **Google OAuth + Business Profile API** — NextAuth Google login (web + lantern). web requests the `business.manage` scope and uses the v4 API (`src/lib/google-business.ts`) to read reviews and post replies. *(On `main`, reads come from the DB seed; live per-user fetching is the `feat/` branch. The Business Profile API is quota-gated and 429s until Google approves the project.)*
- **Resend** (`RESEND_API_KEY`, `ALERT_FROM_EMAIL`) — intended channel for review alerts. Modeled (`AlertConfig`) but **not yet implemented** in code.
- **Deployment:** Vercel, **one project per app**, each on its own domain/subdomain with its own env vars (no `vercel.json`/CI in the repo).

## 7. Where major features live

| Want to change… | Look in |
|---|---|
| The customer form / chip flow / AI review | `apps/form/src/components/ReviewForm.tsx`, `apps/form/src/app/api/generate` |
| Review gating threshold / Google redirect | `apps/form/src/components/ReviewForm.tsx`, `apps/form/src/lib/place-id.ts` |
| AI reply drafting / posting | `apps/web/src/app/api/generate-reply`, `apps/web/src/app/api/reviews/[reviewId]/reply`, `apps/web/src/lib/google-business.ts` |
| Sentiment/taxonomy analytics | `apps/web/src/app/actions/analyzeReviews.ts`, `packages/llm/src/review-analyzer.ts`, `apps/web/src/app/dashboard/analytics` |
| Prompts / LLM behavior / provider | `packages/llm/src/*` |
| Form branding + label/active editing + QR | `apps/web/src/app/dashboard/feedback/settings`, `apps/web/src/actions/upsertFormConfig.ts` |
| Tag identity / multilingual labels / fallback | `packages/db/prisma/schema.prisma` (`Tag`/`FeedbackCategory`), `packages/types/src/index.ts` (`resolveLabel`), `packages/llm/src/label-translator.ts` |
| Starter form template / business onboarding | `packages/db/src/taxonomy-templates.ts`, `apps/lantern/src/actions/businesses.ts`, `apps/web/src/actions/seedStarterForm.ts` |
| Auth / scopes / session | `apps/web/src/lib/auth.ts`, `apps/lantern/src/lib/auth.ts` |
| Database schema | `packages/db/prisma/schema.prisma` (+ `prisma/seed.ts`) |
| Waitlist / marketing | `apps/landing/src` |
| Admin views | `apps/lantern/src/app/dashboard` |
