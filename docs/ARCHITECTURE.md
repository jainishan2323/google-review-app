# Architecture

A planning map for reasoning about changes without the whole codebase open. For commands, env var names, and conventions, see [/CLAUDE.md](../CLAUDE.md).

> Describes `main` as it stands today. The dashboard resolves the business from the **signed-in owner's verified email** (`requireCurrentBusiness()`), and an Operator (`role=ADMIN`) gets read/operate access to **every** business (ADR 0004 / 0014); `DEV_BUSINESS_ID` is no longer read. The "fetch real Google reviews per signed-in user" work lives on branch `feat/live-google-business-data` and is not reflected here except where noted.

## 1. Overview

**Jugnoo** helps local businesses grow and manage their Google reputation. It has three surfaces backed by one shared database:

1. **Customer review funnel** (`apps/form`) — a customer scans a QR code, lands on a per-business form, rates their visit, and picks descriptive chips. An LLM turns that into a polished review. **Happy customers (rating ≥4)** get the draft + a one-tap redirect to Google's write-review page; **unhappy customers (<4)** are routed into *private* feedback that never reaches Google. This "review gating" both lifts the public rating and captures problems privately.
2. **Owner dashboard** (`apps/web`) — the business owner signs in with Google, sees their reviews and private feedback, drafts AI replies, and reads analytics produced by a batch sentiment/taxonomy analyzer. Owners also configure the form (branding, chip taxonomy), download/print their branded QR review **cards** (a self-serve print-sheet PDF), and request operator-fulfilled physical card **Print Orders**.
3. **Marketing + admin** — `apps/landing` is the public site + waitlist; `apps/lantern` is an internal admin console (businesses, waitlist, app feedback, **counter-card QR token minting/assignment**, print-order fulfillment) gated to allowlisted emails.

Two cross-cutting subsystems span apps and have their own ADRs: **counter-card QR tokens** (the form's `/q/{token}` resolver + Lantern token management) and **review cards / print** (web self-print + Lantern operator fulfillment). Both are detailed below.

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
│   ├── email/       Transactional email (Resend + react-email templates)
│   ├── types/       Shared TS interfaces + taxonomy/analysis types
│   └── ui/          Shared React primitives (button/card/star-rating)
├── turbo.json       Task graph + the env vars each build receives
└── pnpm-workspace.yaml
```

### apps/web — owner dashboard
- `src/app/dashboard/` — pages: `page.tsx` (overview/stats), `reviews/`, `analytics/`, `feedback/` (private feedback) and `feedback/settings/` (form config), `cards/` (branded QR review cards + self-print PDF + Print Order studio), `settings/`. `layout.tsx` renders the sidebar/header.
- `src/app/api/` — route handlers: `reviews/[reviewId]/reply` (post reply to Google), `generate-reply` (AI draft), `alerts` (alert-config CRUD), `feedback*` and `analytics/sentiment` (data for charts), `auth/[...nextauth]`.
- `src/app/actions/analyzeReviews.ts` + `src/actions/` — server actions (batch analysis, form-config upsert, feedback submit, print-order submit).
- `src/components/cards/CardStudio.tsx` + `src/lib/card-templates.ts`, `src/lib/qr-svg.ts`, `src/lib/print-sheet.ts` — render review cards from slotted SVG templates (ADR 0011) and build the client-side, multi-up, logo-less self-print PDF (ADR 0013).
- `src/lib/auth.ts` — NextAuth Google config. **Phase 1 requests only `openid email profile`** (identity, no `business.manage`, no offline/consent — see ADR 0003); the Business Profile read/reply path is built but deferred to a Phase 2 "Connect Google" step. `src/lib/current-business.ts` — `requireCurrentBusiness()` resolves the business from `session.user.email` (ADR 0004); an Operator (`role=ADMIN`) may view/operate every business (ADR 0014). `src/lib/google-business.ts` — thin wrapper over the Google Business Profile **v4** API (`fetchReviews`, `postReply`). `src/lib/mock-data.ts` — sample data.
- `src/middleware.ts` — guards `/dashboard/*` with NextAuth.

### apps/form — customer funnel
- `src/app/[businessId]/page.tsx` — server component; loads business + form config via `src/lib/form-data.ts`, streams `ReviewForm` behind a skeleton.
- `src/components/ReviewForm.tsx` — the whole interactive flow (rating → chips → AI generate → copy/redirect or private submit).
- `src/app/api/` — `generate` (LLM review text, optional streaming), `submit` (basic anonymous feedback), `submit-private` (private/`google_redirect` feedback with tag classification), `app-feedback` (emoji rating of the product itself).
- `src/app/q/[token]/page.tsx` — **counter-card QR token resolver** (ADR 0015): the QR encodes `…/q/{token}`; this route looks up the `QrCode` and `redirect`s to `/{businessId}?src=qr&token=…` when assigned, else shows a neutral "card not active / retired" page (unknown ≡ unassigned, so the resolver can't be probed). Always dynamic (`revalidate = 0`).
- `src/lib/place-id.ts` — normalizes Google Place IDs for the write-review URL.

### apps/lantern — admin
- `src/app/dashboard/` — `businesses/`, `waitlist/`, `app-feedback/`, `qr-codes/` (token minting + on-site assignment) views. `src/lib/auth.ts` gates sign-in to `ADMIN_EMAILS`.
- `src/actions/businesses.ts` — operator onboarding: creates the owner + `Business` and seeds its form from the Business Type's Taxonomy Template (`applyTaxonomyTemplate`) in one transaction. `reseedTaxonomy` re-seeds businesses that have no form.
- `src/actions/qrCodes.ts` — token-card lifecycle (ADR 0015): `mintBatch` (mint N unassigned tokens via `mintTokens`), `assignTokens` (typed bulk assign 1–N codes → one business; unmatched codes surfaced), `unassignToken` / `retireToken` / `restoreToken`. `src/actions/printOrders.ts` — operator print-order fulfillment (ADR 0012).
- `src/app/dashboard/qr-codes/[token]/svg/route.ts` + `/pdf/route.ts` — per-token QR exports: a bare SVG (manual editing) and the **Token Print Sheet** PDF (ADR 0017) — one A4 page with the token's QR stamped into all four counter-card design variants, **fully vector** (`src/lib/token-print-sheet.ts` + `src/lib/qr-svg.ts` `buildQrPath` → pdf-lib `drawSvgPath`, over the build-generated `print-template.generated.ts` vector template).

### apps/landing — marketing
- `src/app/page.tsx` + components (`WaitlistForm`, `ScreenshotCarousel`, `CookieBanner`), legal pages (`impressum`, `privacy`, `terms`), `robots.ts`, `sitemap.ts`. No DB/auth dependency beyond the waitlist write.

### packages
- **db** — `prisma/schema.prisma` (Postgres), `prisma/migrations/`, `prisma/seed.ts`, `src/taxonomy-templates.ts` (code-defined Taxonomy Templates per Business Type + `applyTaxonomyTemplate`), and `src/index.ts` exporting the `prisma` singleton + all Prisma types + the template helpers.
- **llm** — `client.ts` (`getLLMClient()` picks a provider by `LLM_PROVIDER`), `providers/openai.ts` + `providers/types.ts` (the `LLMProvider` interface: `complete` / `stream`), and feature helpers: `review-generator.ts`, `review-analyzer.ts`, `sentiment-analyzer.ts`, `reply-drafter.ts`, `label-translator.ts` (batched chip-label translation for fill-blanks auto-translate). `index.ts` is the public surface.
- **email** — `src/send.ts` (`sendPrivateFeedbackAlert`), `src/layout.tsx` (shared brand `<EmailLayout>`), `src/templates/*` (react-email templates), `src/index.ts` (public surface). Owns the Resend client + from-address; imported by apps that send mail (form today). Reads `RESEND_API_KEY`/`ALERT_FROM_EMAIL`; no-ops if unset. See ADR 0018.
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
1. Owner hits `apps/web`; `/` redirects to `/dashboard`; `middleware.ts` requires a NextAuth Google session (`src/lib/auth.ts`, Phase-1 identity scope only).
2. `requireCurrentBusiness()` maps `session.user.email` → `User` → their `Business` (ADR 0004); an Operator (`role=ADMIN`) sees every business (ADR 0014, active business chosen via a validated cookie per ADR 0010). Dashboard pages then query Postgres for that business — reviews, private feedback, and aggregates for the stat cards/charts.
3. **Replying:** owner clicks draft → `api/generate-reply` calls `draftReply` (`@repo/llm`). Posting a reply → `api/reviews/[reviewId]/reply` → `postReply` in `google-business.ts` writes to the Google Business Profile API and flips `isReplied` in the DB.
4. **Batch analysis:** `analyzeBatchOnce(businessId)` (`src/app/actions/analyzeReviews.ts`) pulls up to 15 un-analyzed reviews/feedback, builds a `TaxonomyCategory[]` from the active tags' **default-language labels**, and calls `analyzeBatch` (`@repo/llm`). The analyzer returns labels; the action maps them **back to tag identities** before writing `tags` / `negativeTags` / `unmappedInsights` and stamping `analyzedAt`. It's **idempotent** (the WHERE clause excludes already-analyzed rows) so the client loops it to completion. Analytics pages read those identities and resolve id→label for display.

### C. Counter-card QR tokens (mint → assign → resolve)
A `QrCode` row is a **token→business mapping**, not a physical card — the same short, ambiguity-free token (e.g. `K7M2P`, uppercase, no 0/O/1/I/L; `packages/db/src/qr-token.ts`) may be printed on any number of cards (ADR 0015, supersedes ADR 0001).
1. **Mint** (Lantern): `mintBatch` → `mintTokens(n)` creates N `status:"unassigned"` rows (collision-retried). The Operator downloads each token's QR as SVG, or the four-variant **Token Print Sheet** PDF (ADR 0017), and prints generic logo-less stock.
2. **Assign on-site** (Lantern): `assignTokens` bulk-links 1–N typed codes → one `Business` (`status:"assigned"`, `assignedAt`); unmatched/retired codes are surfaced, not silently dropped. `unassign`/`retire`/`restore` move tokens between `unassigned`/`assigned`/`retired`.
3. **Resolve** (form): a customer scans → `…/q/{token}` → `apps/form/src/app/q/[token]/page.tsx` looks up the token and, if `assigned`, `redirect`s to that business's form (`?src=qr&token=` for GA only, not persisted), feeding flow A. Unassigned/unknown/retired tokens get a neutral page. The resolver is always dynamic so reassignment is never served stale.

### D. Review cards & print
Two divergent paths produce the same artwork (review cards rendered from **slotted SVG templates**, ADR 0011):
- **Web self-print** (`apps/web/dashboard/cards`): the owner generates a **client-side, rasterized, multi-up, logo-less PDF** of QR-only cards to print themselves (ADR 0013, `src/lib/print-sheet.ts`). The full card studio (themes/NFC/"send to print") is feature-flagged off for the pilot (`NEXT_PUBLIC_CARDS_STUDIO`, ADR 0002).
- **Print Orders** (`apps/web` submit → `apps/lantern` fulfill): the owner submits a **cart** of card variants (one logo snapshot per order, only one active order at a time, ADR 0012); the Operator fulfills it manually in Lantern. The only path to NFC cards.

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
- **QrCode** — a **token→business mapping** for counter-card QR codes (ADR 0015): `token` (unique, uppercase), `status` (`unassigned`/`assigned`/`retired`), nullable `businessId` (the mapping is owned, not a physical card), optional `placement`/`batchLabel`, `assignedAt`. Resolved by the form's `/q/{token}`.
- **PrintOrder** + **PrintOrderItem** — a business's request for operator-fulfilled physical cards (ADR 0012): a **cart** of line-item variants submitted together, one `logoUrl` snapshot per order, `status` `pending`/`fulfilled`, only one active order per business. (Flat `quantity`/`hasNfc`/`language`/`theme` columns on `PrintOrder` are LEGACY/RETIRED — pre-ADR-0012 rows only.)
- **WaitlistEntry** (landing), **AppFeedback** (product-level emoji rating).

## 6. External integrations

- **PostgreSQL** via Prisma (`@repo/db`, `DATABASE_URL`) — the single source of truth shared by all apps.
- **OpenAI** via `@repo/llm` (`OPENAI_API_KEY`, `LLM_PROVIDER`) — review generation (form), reply drafting + sentiment/taxonomy analysis (web). Provider is abstracted behind `LLMProvider`; feature code never imports the SDK directly, so swapping providers is a one-file change in `client.ts`.
- **Google OAuth + Business Profile API** — NextAuth Google login (web + lantern). **web's Phase 1 requests only `openid email profile`** (identity, no app-verification warning); the `business.manage` scope + v4 API read/reply path (`src/lib/google-business.ts`) is built but deferred to a Phase 2 "Connect Google" step (ADR 0003). *(On `main`, reads come from the DB seed; live per-user fetching is the `feat/live-google-business-data` branch. The Business Profile API is quota-gated and 429s until Google approves the project.)*
- **Resend** (`RESEND_API_KEY`, `ALERT_FROM_EMAIL`) — transactional email via `@repo/email`. **Wired** for private-feedback alerts: a new `source=private` feedback emails the owner from `apps/form`'s `submit-private` route (ADR 0018). The `AlertConfig`-based Google-review alerts (`NEW_REVIEW`/`RATING_DROP`) remain **not implemented**.
- **Deployment:** Vercel, **one project per app**, each on its own domain/subdomain with its own env vars (no `vercel.json`/CI in the repo).

## 7. Where major features live

| Want to change… | Look in |
|---|---|
| The customer form / chip flow / AI review | `apps/form/src/components/ReviewForm.tsx`, `apps/form/src/app/api/generate` |
| Review gating threshold / Google redirect | `apps/form/src/components/ReviewForm.tsx`, `apps/form/src/lib/place-id.ts` |
| AI reply drafting / posting | `apps/web/src/app/api/generate-reply`, `apps/web/src/app/api/reviews/[reviewId]/reply`, `apps/web/src/lib/google-business.ts` |
| Sentiment/taxonomy analytics | `apps/web/src/app/actions/analyzeReviews.ts`, `packages/llm/src/review-analyzer.ts`, `apps/web/src/app/dashboard/analytics` |
| Prompts / LLM behavior / provider | `packages/llm/src/*` |
| Form branding + label/active editing | `apps/web/src/app/dashboard/feedback/settings`, `apps/web/src/actions/upsertFormConfig.ts` |
| Counter-card QR tokens (mint/assign/resolve) | `packages/db/src/qr-token.ts`, `apps/lantern/src/actions/qrCodes.ts`, `apps/lantern/src/app/dashboard/qr-codes`, `apps/form/src/app/q/[token]` |
| Review cards / self-print PDF | `apps/web/src/app/dashboard/cards`, `apps/web/src/components/cards/CardStudio.tsx`, `apps/web/src/lib/{print-sheet,card-templates,qr-svg}.ts` |
| Token Print Sheet (operator, vector) | `apps/lantern/src/app/dashboard/qr-codes/[token]/pdf`, `apps/lantern/src/lib/token-print-sheet.ts`, `apps/lantern/scripts/gen-print-template.mjs` |
| Print Orders (fulfillment) | `apps/web/src/actions` (submit), `apps/lantern/src/actions/printOrders.ts`, `apps/lantern/src/app/dashboard` |
| Tag identity / multilingual labels / fallback | `packages/db/prisma/schema.prisma` (`Tag`/`FeedbackCategory`), `packages/types/src/index.ts` (`resolveLabel`), `packages/llm/src/label-translator.ts` |
| Starter form template / business onboarding | `packages/db/src/taxonomy-templates.ts`, `apps/lantern/src/actions/businesses.ts`, `apps/web/src/actions/seedStarterForm.ts` |
| Auth / scopes / session | `apps/web/src/lib/auth.ts`, `apps/lantern/src/lib/auth.ts` |
| Business resolution / operator access | `apps/web/src/lib/current-business.ts` (ADR 0004 / 0010 / 0014) |
| Email alerts / templates | `packages/email/src/*`, `apps/form/src/app/api/submit-private/route.ts` (ADR 0018) |
| Database schema | `packages/db/prisma/schema.prisma` (+ `prisma/seed.ts`) |
| Waitlist / marketing | `apps/landing/src` |
| Admin views | `apps/lantern/src/app/dashboard` |
