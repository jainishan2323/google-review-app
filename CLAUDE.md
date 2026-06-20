# CLAUDE.md

Jugnoo — a Google review management platform for local businesses (collect customer feedback, route happy customers to Google, AI-draft replies, analyze sentiment). A pnpm + Turborepo monorepo of four Next.js 16 apps and four shared packages.

> Architecture, request flows, and where features live → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). This file is the operational briefing only.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.7 (strict) · Tailwind v4 · Prisma 5 + PostgreSQL · NextAuth v4 (Google) · OpenAI · Zod v4. **Package manager: pnpm 9.15** (workspaces). Build orchestration: Turborepo.

## Commands

Run from the repo root unless noted.

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev (all apps) | `pnpm dev` — frees ports 3000–3003, then `turbo run dev` |
| Dev (one app) | `pnpm --filter @repo/web dev` (or `@repo/form`, `@repo/landing`, `@repo/lantern`) |
| Build | `pnpm build` |
| Type-check | `pnpm type-check` (per app: `pnpm --filter @repo/web type-check`) |
| DB client/codegen | `pnpm db:generate` |
| DB push schema | `pnpm db:push` |
| DB migrate | `pnpm db:migrate` |
| DB seed | `pnpm --filter @repo/db db:seed` (runs `prisma/seed.ts` via tsx) |
| Prisma Studio | `pnpm db:studio` |

**App ports:** web `3000`, form `3001`, landing `3002`, lantern `3003`.

**Non-obvious:**
- App `build` scripts run `prisma generate` first; `type-check` and `build` depend on `^build` (upstream packages build first) — run `pnpm db:generate` after schema changes or types will be stale.
- **`pnpm lint` / `next lint` is currently broken** under Next 16 (the `lint` script is misconfigured and errors with `no such directory: .../lint`). Rely on `pnpm type-check` as the gate; don't trust a green lint.
- No test suite exists in the repo. "Verify" = `type-check` + `build` + manual run.

## Conventions

- **Workspace imports:** consume shared code via `@repo/db`, `@repo/llm`, `@repo/types`, `@repo/ui`, `@repo/email` (packages export raw `src/*` — no build step to import them).
- **Prisma client:** always `import { prisma } from "@repo/db"` (a global singleton); never `new PrismaClient()`.
- **LLM access:** call helpers from `@repo/llm` (`draftReply`, `generateReviewText`, `analyzeBatch`, …) or `getLLMClient()`. **Never import `openai` (or any provider SDK) directly in feature code** — the provider is swappable via `LLM_PROVIDER`.
- **App Router:** server components by default; mark client components with `"use client"`. Mutations go through server actions (`src/actions/*`, `src/app/actions/*`) or route handlers (`src/app/api/*`).
- **API input validation:** validate request bodies with Zod and sanitize free text (see `apps/form/src/app/api/generate/route.ts` for the `sanitize` + schema pattern).
- **UI components:** there are **two** layers — shared primitives in `@repo/ui` *and* per-app shadcn-style components in each app's local `src/components/ui/*`. Most app UI uses the local copies; check the local folder first before reaching for `@repo/ui`.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss`; `cn()` helper lives in each app's `src/lib/utils.ts`.

## Environment variables (names only — never commit values)

See `.env.example` for the canonical list. Used across apps (declared in `turbo.json`):

- **Database:** `DATABASE_URL`
- **LLM:** `OPENAI_API_KEY`, `LLM_PROVIDER` (default `openai`), `AI_STREAMING` (`true` to stream form generation)
- **Auth (web + lantern):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Admin allowlist (lantern):** `ADMIN_EMAILS` (comma-separated)
- **Email (alerts):** `RESEND_API_KEY`, `ALERT_FROM_EMAIL`
- **App URLs / dev:** `NEXT_PUBLIC_FORM_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, `DEV_BUSINESS_ID`

## Gotchas / things to know

- **Form caching: 30s TTL in prod, dynamic in dev.** The form route (`apps/form/src/app/[businessId]/page.tsx`) uses `revalidate = 30` + `generateStaticParams()` (the latter is required to actually engage the Full Route Cache on a dynamic segment), and `getFormData` (`apps/form/src/lib/form-data.ts`) wraps the query in `unstable_cache` (30s) — **only when `NODE_ENV === "production"`**. In dev the cache is bypassed and `next dev` ignores ISR, so local config edits show instantly. There is **no cross-deployment invalidation** (dashboard/Lantern are separate Vercel deploys and can't bust the form's cache), so a saved config edit takes up to ~30s to surface on the live form (rides the TTL + stale-while-revalidate). See `docs/adr/0016`.
- **Dashboard resolves the business from the signed-in owner's verified email.** `apps/web` pages call `requireCurrentBusiness()` (`apps/web/src/lib/current-business.ts`), which maps `session.user.email` → `User` → their `businesses` (renders the first; modelled as a list). Owners + businesses are pre-created by the Operator in Lantern (`/dashboard/businesses`); an unprovisioned email lands on `/no-business`. Resolution keys off email, **never** `session.userId` (the unreliable Google `sub`). An **Operator (`role=ADMIN`) bypasses single-owner scoping and may view/operate every business** (active one selected via a validated cookie — ADR-0010/0014). See `docs/adr/0004-owner-business-linking-by-verified-email.md`. (`DEV_BUSINESS_ID` is no longer read by the dashboard.)
- **Live Google Business data is in progress on the `feat/live-google-business-data` branch**, not `main`. That branch resolves the business from the signed-in session and fetches reviews live from the Business Profile API. Note: that API is quota-gated and returns 429 until Google approves the project. Don't document/assume live data when working on `main`.
- **Email: private-feedback alerts are wired; `AlertConfig` is not.** New private feedback (rating <4, `source=private`) emails the business owner via the shared **`@repo/email`** package (Resend + react-email), fired from `apps/form`'s `submit-private` route with `after()` (best-effort; never blocks/fails the customer submit). The email is deliberately detail-free (stars + dashboard CTA). Needs `RESEND_API_KEY` + `ALERT_FROM_EMAIL` (+ `NEXT_PUBLIC_DASHBOARD_URL`) on the **form** app; without them it no-ops. The separate `AlertConfig` model (`NEW_REVIEW`/`RATING_DROP`) is still **inert** — no UI, no sender; per-event only (digest/cron deferred). See ADR-0018.
- **Owner Google sign-in is Phase 1 (identity only).** `apps/web` requests just `openid email profile` — no `business.manage`, no offline/consent — so there's no "unverified app" warning and no Google review access yet. The Reviews + Analytics tabs are kept in the nav as "coming soon"; Overview is private-feedback-first. The heavy scope is deferred to a Phase 2 "Connect Google" step. See `docs/adr/0003-google-signin-split-identity-then-authorization.md`. API routes (incl. `/api/generate-reply`) now scope to the owner via email resolution; `/api/reviews/[reviewId]/reply` still needs the Phase 2 access token and 401s until then.
- **Deploy:** Vercel, **one project per app** (web/form/landing/lantern on their own domains/subdomains). Each project needs its own env vars set; there is no `vercel.json` or CI in the repo.

## Vocabulary

- **Jugnoo** — the product (firefly in Hindi). Canonical marketing domain `jugnoo.de`; form at `feedback.jugnoo.de`. The old `*.jugnoo.olbaid.de` domains stay attached (form dual-serves both; landing/dashboard/Lantern redirect old→new) so legacy printed QR cards keep resolving — see `docs/domain-migration-todos.md`.
- **Review gating funnel** — the form's core flow: rating ≥4 → AI-drafted review + redirect to Google; rating <4 → captured privately (not sent to Google).
- **Anonymous / private feedback** — customer feedback stored in `AnonymousFeedback` (not a public Google review). `source` is `private` or `google_redirect`.
- **Taxonomy / categories** — per-business `FeedbackCategory` (a "zone": Kitchen / Service) each owning `Tag` rows; drives both the form and the analyzer. Categories + tags carry per-language `labels` (JSON) and an optional `canonicalKey`.
- **Tag identity vs display label** — a `Tag`'s identity is its cuid `id` (stable, never shown); its display is the per-language `labels`. **`Review.tags` / `AnonymousFeedback.tags` store identities, never wording** — storage/analytics/AI operate on identity, only the form + settings read a label. `negativeTags` is derived from each tag's fixed `polarity`. See `docs/adr/0005-tag-identity-separate-from-display-label.md` + the glossary in `CONTEXT.md`.
- **Business Type / Taxonomy Template** — `Business.businessType` (`restaurant` now) picks a code-defined **Taxonomy Template** (`packages/db/src/taxonomy-templates.ts`) that `applyTaxonomyTemplate()` seeds into the form **once at onboarding**; create-only/idempotent, then owned per business. See `docs/adr/0006-taxonomy-templates-code-defined-applied-at-onboarding.md`.
- **Mapped tags vs unmapped insights** — the batch analyzer maps review text onto the taxonomy (mapped tags, stored as identities) and surfaces novel themes outside it (unmapped insights, free strings).
- **Lantern** — the internal admin app (`apps/lantern`).
- **Operator / Admin** — a `User` with `role=ADMIN`; signs into both Lantern (onboarding, QR tokens, print orders) and the dashboard, where they get **cross-business access** (view/operate *every* business — a read of all rows, not co-ownership). Admin role and Google review access are **orthogonal**: being admin doesn't grant the Phase-2 `business.manage` token. See ADR-0014.
- **Scan token / Token card** — a counter-card QR code is a short, ambiguity-free **token** (uppercase, no 0/O/1/I/L, e.g. `K7M2P`; `packages/db/src/qr-token.ts`). A `QrCode` row is a **token→business *mapping*, not a physical card** — the same token can be printed on any number of cards. The QR encodes `…/q/{token}`, resolved by the form app (`apps/form/src/app/q/[token]`, always dynamic) to the assigned business. Lifecycle (mint → assign on-site → unassign/retire/restore) lives in `apps/lantern/src/actions/qrCodes.ts`. See ADR-0015.
- **Review card / Cards studio** — branded QR cards rendered from **slotted SVG templates** (ADR-0011) in `apps/web/dashboard/cards`. The full studio (themes/NFC/"send to print") is feature-flagged off for the pilot via `NEXT_PUBLIC_CARDS_STUDIO` (ADR-0002).
- **Print Sheet** (web, self-serve) — a **client-side, rasterized, multi-up, logo-less PDF** of QR-only cards the owner prints themselves (`apps/web/src/lib/print-sheet.ts`, ADR-0013).
- **Token Print Sheet** (Lantern, operator) — a per-token, **fully-vector** A4 PDF carrying that token's QR stamped into four counter-card variants (`apps/lantern/src/lib/token-print-sheet.ts`, ADR-0017). Built from a committed vector template (`print-template.generated.ts`) generated by `pnpm --filter @repo/lantern gen:print-template` from the artboard SVG — **re-run that script after any artboard change** (the embedded PDF + slot rects are generated, not hand-authored). Distinct from the web Print Sheet (rasterized).
- **Print Order** — a business's request for Jugnoo to produce + ship physical cards: a **cart** of variants, one logo snapshot per order, only one active order at a time, fulfilled manually by the Operator in Lantern. The only path to NFC cards. See ADR-0012.
